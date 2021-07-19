"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IssuesProvider = exports.convertTodoItems = exports.flattenOnce = void 0;
/* eslint-disable no-empty-function */
/* eslint-disable class-methods-use-this */
// eslint-disable-next-line max-classes-per-file
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const vscode_1 = require("vscode");
const readline = require("readline");
const events_1 = require("events");
const utilities_1 = require("@jamesgmarks/utilities");
const gitlabApi_1 = require("./gitlabApi");
const issueOutput = vscode_1.window.createOutputChannel('IssueTracke2r');
class Issue extends vscode.TreeItem {
    constructor(label, issueNumber, collapsibleState, line, lineNumber) {
        super(label, collapsibleState);
        this.label = label;
        this.issueNumber = issueNumber;
        this.collapsibleState = collapsibleState;
        this.line = line;
        this.lineNumber = lineNumber;
        this.iconPath = {
            light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg'),
        };
        this.tooltip = `${this.label}-${this.issueNumber}`;
        this.description = this.issueNumber;
    }
}
const flattenOnce = (usageOrCostArray) => (usageOrCostArray.reduce((acc, curr) => [...acc, ...curr], []));
exports.flattenOnce = flattenOnce;
const getAllFiles = (dirPath, arrayOfFiles) => {
    const foldersToIgnore = ['node_modules', '.vscode'];
    const files = fs.readdirSync(dirPath);
    let _arrayOfFiles = arrayOfFiles || [];
    files.forEach((file) => {
        issueOutput.appendLine(`file ${file}`);
        if (fs.statSync(`${dirPath}/${file}`).isDirectory()) {
            _arrayOfFiles = (!foldersToIgnore.includes(`${file}`)
                ? getAllFiles(`${dirPath}/${file}`, _arrayOfFiles)
                : _arrayOfFiles);
        }
        else if (file.includes('.ts')) {
            _arrayOfFiles.push(path.join(dirPath, '/', file));
        }
    });
    return arrayOfFiles;
};
const getIssueItems = (workspaceRoot) => __awaiter(void 0, void 0, void 0, function* () {
    const dirItems = getAllFiles(workspaceRoot, []);
    const issueItems = yield utilities_1.mapAsync(dirItems, (file, i) => __awaiter(void 0, void 0, void 0, function* () {
        const fileName = file.replace(/\\/g, '/');
        // issueOutput.appendLine(`file ${fileName}`);
        const rl = readline.createInterface({
            input: fs.createReadStream(fileName),
            crlfDelay: Infinity,
        });
        const issues = [];
        let lineNumber = 0;
        rl.on('line', (line) => {
            lineNumber++;
            const loweredCasedLine = line.toLowerCase();
            const isIssue = loweredCasedLine.includes('issue:');
            const isTodo = loweredCasedLine.includes('todo:');
            const containsIssue = isIssue || isTodo;
            if (containsIssue) {
                const splitString = line.split(':');
                const issueComment = splitString[1];
                const issueDesc = isIssue ? `ISSUE: ${issueComment}` : `TODO: ${issueComment}`;
                const issue = new Issue(issueDesc, `${i}`, vscode.TreeItemCollapsibleState.Collapsed, line, lineNumber);
                issues.push(issue);
            }
        });
        yield events_1.once(rl, 'close');
        return issues;
    }));
    return exports.flattenOnce(issueItems);
});
const convertTodoItems = (workspaceRoot) => __awaiter(void 0, void 0, void 0, function* () {
    const dirItems = getAllFiles(workspaceRoot, []);
    // const dirItems = ['C:/Users/Amir/Documents/Rentsync/billing-system/src/tools/mail/sendgrid.ts'];
    // TODO:
    const files = yield utilities_1.mapAsync(dirItems, (file, i) => __awaiter(void 0, void 0, void 0, function* () {
        var e_1, _a;
        const fileName = file.replace(/\\/g, '/');
        issueOutput.appendLine(`file ${fileName}`);
        const rl = readline.createInterface({
            input: fs.createReadStream(fileName),
            crlfDelay: Infinity,
        });
        let replacementFile = '';
        let madeChange = false;
        let lineNumber = 0;
        try {
            // rl.on('line', async (line: string) => {
            // eslint-disable-next-line no-restricted-syntax
            for (var rl_1 = __asyncValues(rl), rl_1_1; rl_1_1 = yield rl_1.next(), !rl_1_1.done;) {
                const line = rl_1_1.value;
                lineNumber++;
                const containsTODO = line.toLowerCase().includes('todo:') || line.toLowerCase().includes('todo');
                let replacementLine = line;
                if (containsTODO) {
                    madeChange = true;
                    const title = line
                        .replace('//', '')
                        .replace('todo:', '')
                        .replace('TODO:', '')
                        .replace('todo', '')
                        .replace('TODO', '');
                    const description = `File: ${file} \n\n Line: ${lineNumber}`;
                    const issue = JSON.parse(yield gitlabApi_1.createIssue(title, description));
                    const issueNumber = issue.iid;
                    replacementLine = line
                        .replace('todo:', `ISSUE:#${issueNumber}:`)
                        .replace('TODO:', `ISSUE:#${issueNumber}:`)
                        .replace('todo', `ISSUE:#${issueNumber}:`)
                        .replace('TODO', `ISSUE:#${issueNumber}:`);
                    issueOutput.appendLine(replacementLine);
                }
                replacementFile += `${replacementLine}\n`;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (rl_1_1 && !rl_1_1.done && (_a = rl_1.return)) yield _a.call(rl_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        // });
        // await once(rl, 'close');
        rl.close();
        if (madeChange) {
            fs.writeFileSync(fileName, replacementFile);
            issueOutput.appendLine(`${lineNumber} ${file}`);
            // write replacement file
        }
    }));
});
exports.convertTodoItems = convertTodoItems;
class IssuesProvider {
    constructor(_workspaceRoot) {
        this._workspaceRoot = _workspaceRoot;
        this._onDidChangeTreeData = (new vscode.EventEmitter());
        this.onDidChangeTreeData = (this._onDidChangeTreeData.event);
        this.workspaceRoot = _workspaceRoot;
        // issueOutput.appendLine(this.workspaceRoot);
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        return __awaiter(this, void 0, void 0, function* () {
            if (element) {
                return [new Issue(`Line#/View in Gitlab`, `https://gitlab.com/llws/platform/billing-system/-/issues/${element.description}`, vscode.TreeItemCollapsibleState.None)];
            }
            return getIssueItems(this.workspaceRoot);
        });
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
}
exports.IssuesProvider = IssuesProvider;
//# sourceMappingURL=issues.js.map