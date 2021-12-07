# TodoPlusExtensions

This extensions builds on the Todo+ extension and adds some overview generation behaviour to get an overview over completed tasks within a given timeframe.

## Features

Allows use of `@overview` tags to generate (Alt+G) a collection of items both started and done. Items can be excluded from the overview with `@exclude` (Alt+E). It allows for general overviews with all started and done tasks, or to specify a from date (to present) `@overview(YY-MM-dd hh:mm)` same format as Todo+ uses.

## Release Notes

### 1.2.0
- Added ability to toggle exclude on multiple lines at once
- Fixed issue with generate overview where month were one behind selected month
- Fixed minor spacing issue where 2 whitespaces could end up before tag was inserted for time and exclude tags

### 1.1.0
- Added `@time` tag (Alt+t) to tag comments etc. with current timestamp

### 1.0.0

Initial release of TodoPlusExtensions
- Overview generation with from date
- Exclude tag