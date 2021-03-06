// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as moment from 'moment';

interface TodoItem {
	text: string;
	type: string;
	done: boolean;
	tags: string[];
	children: TodoItem[];
	comments: string[];
}

const parseDocument = (lines: string[]): TodoItem[] => {
	let addToStruct = (struct: TodoItem[], data: TodoItem, depth: number) => {
		if (depth == 0) {
			struct.push(data);
		}
		else if (struct[struct.length - 1].children.length == 0 && data.type == 'bp') {
			struct[struct.length - 1].comments.push(data.text);
		} 
		else {
			addToStruct(struct[struct.length - 1].children, data, depth - 1);
		}
	};
	let projects = lines.reduce((struct, line) => {
		if (line.trim() == '') {
			return struct;
		}
		const depth = line.split('  ').findIndex(c => c != '');
		const data: TodoItem = {
			text: line,
			type: '',
			done: false,
			tags: [...line.matchAll(/(@[^\(\s]+)/g)].map(v => v[0].toLowerCase()),
			children: [],
			comments: [],
		};
		if (line.trim().indexOf('☐') == 0) {
			data.type = 'open';
		}
		else if (line.trim().indexOf('✔') == 0) {
			data.type = 'done';
		}
		else if (line.trim().indexOf('✘') == 0) {
			data.type = 'cancel';
		}
		else if (line.trim().indexOf('*') == 0) {
			data.type = 'bp';
		}
		else if (line.trim().indexOf(':') > -1) {
			data.type = 'project';
		}
		addToStruct(struct, data, depth);
		return struct;
	}, [] as TodoItem[]);

	let checkStruct = (struct: TodoItem[]) => {
		struct.forEach(obj => {
			if (obj.children.length == 0) {
				if (obj.type == 'project' || obj.type == 'bp') {
					obj.done = true;
				}
				else {
					obj.done = (obj.type == 'done' || obj.type == 'cancel');
				}
			}
			else {
				checkStruct(obj.children);
				if (obj.type == 'project' || obj.type == 'bp') {
					obj.done = obj.children.filter(c => !c.done).length == 0;
				}
				else {
					obj.done = (obj.type == 'done' || obj.type == 'cancel') && obj.children.filter(c => !c.done).length == 0;
				}
			}
		});
	}
	checkStruct(projects);
	return projects;
}

const generateDocument = (struct: TodoItem[]) => {
	return struct.reduce((acc, obj, index) => {
		if (obj.type == 'project' && index > 0) {
			acc += '\n';
		}
		acc += obj.text + '\n';
		acc += obj.comments.join('\n') + (obj.comments.length > 0 ? '\n' : '');
		acc += generateDocument(obj.children);
		return acc;
	}, '');
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	context.subscriptions.push(vscode.commands.registerCommand('todoplusextensions.generateOverviews', () => {
		if (!vscode.window.activeTextEditor) {
			return;
		}
		let lines = vscode.window.activeTextEditor?.document.getText().split("\n");

		const getDate = (date: string) => new Date("20" + date);

		const getLines = (date?: Date) => {
			if (!date) {
				return lines?.filter(line => (line.toLowerCase().indexOf('@started') > -1 || line.toLowerCase().indexOf('@done') > -1) && line.toLowerCase().indexOf('@exclude') == -1);
			}
			else {
				const ls = lines?.filter(line => line.toLowerCase().indexOf('@started') > -1 && line.toLowerCase().indexOf('@done') == -1 && line.toLowerCase().indexOf('@exclude') == -1);
				const done = lines?.filter(line => line.toLowerCase().indexOf('@done') > -1 && line.toLowerCase().indexOf('@exclude') == -1).filter(line => date.getTime() <= getDate(line.toLowerCase().split('@done(')[1].split(')')[0]).getTime());
				done?.forEach(line => ls?.push(line));
				return ls;
			}
		}

		vscode.window.activeTextEditor?.edit(edit => {
			lines?.forEach((ov, i) => {
				if (ov.toLowerCase().indexOf('@overview') == -1) {
					return;
				}
				if (ov.indexOf('@overview(') > -1) {
					const timeStamp = getDate(ov.split('@overview(')[1].split(')')[0]);
					edit.delete(new vscode.Range(new vscode.Position(i, 0), new vscode.Position(i, ov.length)));
					const l = getLines(timeStamp).map(line => `${line}${line.substr(-1) == " " ? "" : " "}@exclude`);
					edit.insert(new vscode.Position(i, 0), l.join('\n'));
				}
				else {
					edit.delete(new vscode.Range(new vscode.Position(i, 0), new vscode.Position(i, ov.length)));
					const l = getLines().map(line => `${line}${line.substr(-1) == " " ? "" : " "}@exclude`);
					edit.insert(new vscode.Position(i, 0), l.join('\n'));
				}
			});
		});
	}));

	context.subscriptions.push(vscode.commands.registerCommand('todoplusextensions.excludeItem', () => {
		if (vscode.window.activeTextEditor) {
			const positions = vscode.window.activeTextEditor.selection;
			const lines = vscode.window.activeTextEditor.document.getText().split('\n');
			vscode.window.activeTextEditor.edit(edit => {
				for (let i = positions.start.line; i <= positions.end.line; i++) {
					let line = lines[i];
					const text = ' @exclude';
					if (line.indexOf(text) > -1) {
						const pos = line.indexOf(text);
						edit.delete(new vscode.Range(new vscode.Position(i, pos), new vscode.Position(i, pos + text.length)));
					}
					else {
						line += ' @exclude';
						edit.insert(new vscode.Position(i, line.length), `${line.substr(-1) == " " ? "" : " "}@exclude`);
					}
				}
			});
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('todoplusextensions.newOverview', () => {
		if (vscode.window.activeTextEditor) {
			const position = vscode.window.activeTextEditor.selection.active;
			let line = vscode.window.activeTextEditor.document.getText().split('\n')[position.line];
			if (line.trim() != '') {
				vscode.window.showErrorMessage('Not able to create overview on non-empty line');
				return;
			}
			vscode.window.showInputBox({
				title: 'Overview lookback time',
				placeHolder: 'How far back to overview (1h = (1 hour), 7d = (7 days), 1m = (1 month), 1y = (1 year))',
			}).then(warp => {
				if (!warp && vscode.window.activeTextEditor) {
					vscode.window.activeTextEditor.edit(edit => {
						edit.insert(position, "@overview")
					});
				}
				else if (warp && vscode.window.activeTextEditor) {
					let date = moment();
					warp = warp.trim();
					if (warp.indexOf('d') > -1) {
						date = date.subtract(Number(warp.replace('d', '')), 'days');
					}
					else if (warp.indexOf('m') > -1) {
						date = date.subtract(Number(warp.replace('m', '')), 'months');
					}
					else if (warp.indexOf('y') > -1) {
						date = date.subtract(Number(warp.replace('y', '')), 'years');
					}
					else if (warp.indexOf('h') > -1) {
						date = date.subtract(Number(warp.replace('h', '')), 'hours');
					}

					vscode.window.activeTextEditor.edit(edit => {
						const year = date.year().toString().substring(2);
						let month = (Number(date.month()) + 1).toString();
						let day = date.date().toString();
						let hour = date.hour().toString();
						let minute = date.minute().toString();
						if (month.length == 1) {
							month = '0' + month;
						}
						if (day.length == 1) {
							day = '0' + day;
						}
						if (hour.length == 1) {
							hour = '0' + hour;
						}
						if (minute.length == 1) {
							minute = '0' + minute;
						}
						edit.insert(position, `@overview(${year}-${month}-${day} ${hour}:${minute})`);
					});
				}
			}, () => {});
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('todoplusextensions.tagTime', () => {
		if (vscode.window.activeTextEditor) {
			const position = vscode.window.activeTextEditor.selection.active;
			
			const line = vscode.window.activeTextEditor.document.getText().split('\n')[position.line];
			const date = moment();
			const year = date.year().toString().substring(2);
			let month = date.month().toString();
			let day = date.date().toString();
			let hour = date.hour().toString();
			let minute = date.minute().toString();
			if (month.length == 1) {
				month = '0' + month;
			}
			if (day.length == 1) {
				day = '0' + day;
			}
			if (hour.length == 1) {
				hour = '0' + hour;
			}
			if (minute.length == 1) {
				minute = '0' + minute;
			}
			vscode.window.activeTextEditor.edit(edit => {
				edit.insert(new vscode.Position(position.line, line.length), `${line.substr(-1) == " " ? "" : " "}@time(${year}-${month}-${day} ${hour}:${minute})`);
			});
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('todoplusextensions.sort', () => {
		if (vscode.window.activeTextEditor) {
			const startPosition = vscode.window.activeTextEditor.selection.active;
			const config = vscode.workspace.getConfiguration('todoplusextensions');
			const reArrangeRootProjects = config.get<boolean>('reArrangeRootProjects');
			const useArchivingSort = config.get<boolean>('useArchivingOnSort');
			const lines = vscode.window.activeTextEditor.document.getText().split('\n');
			const startLine = lines[startPosition.line];
			let projects = parseDocument(lines);

			const sortStruct = (struct: TodoItem[]) => {
				struct.forEach(obj => {
					if (obj.children.length > 0) {
						sortStruct(obj.children);
					}
				});
				struct.sort((a, b) => a.tags.findIndex(v => v == '@started') == -1 && b.tags.findIndex(v => v == '@started') > -1 ? 1 : (a.tags.findIndex(v => v == '@started') > -1 && b.tags.findIndex(v => v == '@started') == -1 ? -1 : 0));
				struct.sort((a, b) => a.done && !b.done ? 1 : (!a.done && b.done ? -1 : 0));
				struct.sort((a, b) => a.type == 'bp' && b.type != 'bp' ? -1 : (a.type != 'bp' && b.type == 'bp' ? 1 : 0));
			}

			if (reArrangeRootProjects) {
				sortStruct(projects);
			}
			else {
				projects.forEach(proj => {
					if (proj.children.length > 0) {
						sortStruct(proj.children);
					}
				});
			}

			const pushChildrenTexts = (struct: TodoItem[]) => {
				struct.forEach(child => {
					child.text = "  " + child.text;
					child.comments = child.comments.map(comment => "  " + comment);
					pushChildrenTexts(child.children);
				});
			}

			const populateArchive = (struct: TodoItem[], archive: TodoItem) => {
				struct.filter(item => item.text.toLowerCase().trim() != 'archive:').forEach(item => {
					let archiveChild = archive.children.find(child => child.text.toLowerCase().trim() == item.text.toLowerCase().trim());
					let isNew = false;
					if (!archiveChild) {
						isNew = true;
						archiveChild = JSON.parse(JSON.stringify(item)) as TodoItem;
						archiveChild.text = "  " + archiveChild.text;
					}
					if (item.done) {
						pushChildrenTexts(archiveChild.children);
						archive.children.push(archiveChild);
						return;
					}
					else if (isNew) {
						archiveChild.children = [];
					}
					populateArchive(item.children, archiveChild);
					if (archiveChild.children.length > 0 && isNew) {
						archive.children.push(archiveChild);
					}
				});
			}

			const removeDoneItems = (struct: TodoItem[]) => {
				const removeIndexes: number[] = [];
				struct.forEach((item, i) => {
					if (item.done && item.type != 'project') {
						removeIndexes.push(i);
					}
					else if (item.text.toLowerCase().trim() != 'archive:') {
						removeDoneItems(item.children);
					}
				});
				removeIndexes.forEach((ind, i) => {
					struct.splice(ind - i, 1);
				});
			}
			
			if (useArchivingSort) {
				let archive = projects.find(item => item.text.toLowerCase().trim() == 'archive:');
				let isNew = false;
				if (!archive) {
					isNew = true;
					archive = { text: 'Archive:', type: 'project', done: true, tags: [], children: [], comments: [] } as TodoItem;
				}
				populateArchive(projects, archive);
				removeDoneItems(projects);
				if (isNew) {
					projects.push(archive);
				}
			}
			const newDocument = generateDocument(projects);
			vscode.window.activeTextEditor.edit(edit => {
				edit.delete(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(lines.length - 1, lines[lines.length - 1].length)));
				edit.insert(new vscode.Position(0, 0), newDocument);
			});
			const startIndex = newDocument.split('\n').findIndex(line => line.trim() == startLine.trim());
			vscode.window.activeTextEditor.selection = new vscode.Selection(startIndex, startPosition.character, startIndex, startPosition.character);
		}
	}));
}

// this method is called when your extension is deactivated
export function deactivate() {}
