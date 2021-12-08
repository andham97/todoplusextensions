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
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('todoplusextensions.generateOverviews', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
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
	});

	context.subscriptions.push(disposable);
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
					vscode.window.showInformationMessage(warp);
					let date = moment();
					warp = warp.trim();
					vscode.window.showInformationMessage(warp);
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
					vscode.window.showInformationMessage(date.toString());

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
			const config = vscode.workspace.getConfiguration('todoplusextensions');
			const onlyRootSpacing = config.get<boolean>('onlyRootProjectSeparationOnSort');
			const reArrangeRootProjects = config.get<boolean>('reArrangeRootProjects');
			const lines = vscode.window.activeTextEditor.document.getText().split('\n');
			const items = [];
			const addToStruct = (struct: TodoItem[], data: TodoItem, depth: number) => {
				if (depth == 0) {
					struct.push(data);
				}
				else {
					addToStruct(struct[struct.length - 1].children, data, depth - 1);
				}
			};
			const projects = lines.reduce((struct, line) => {
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

			const checkStruct = (struct: TodoItem[]) => {
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
			const generate = (struct: TodoItem[], isRoot: boolean) => {
				return struct.reduce((acc, obj, index) => {
					if (obj.type == 'project' && isRoot && index > 0) {
						acc += '\n';
					}
					acc += obj.text + '\n';
					acc += generate(obj.children, !onlyRootSpacing);
					return acc;
				}, '');
			}

			vscode.window.activeTextEditor.edit(edit => {
				edit.delete(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(lines.length - 1, lines[lines.length - 1].length)));
				edit.insert(new vscode.Position(0, 0), generate(projects, true));
			});
		}
	}));
}

// this method is called when your extension is deactivated
export function deactivate() {}
