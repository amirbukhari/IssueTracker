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
Object.defineProperty(exports, "__esModule", { value: true });
exports.IssuesProvider = exports.flattenOnce = exports.Issue = void 0;
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
const issueOutput = vscode_1.window.createOutputChannel('IssueTracke2r');
const settings = vscode_1.workspace.getConfiguration('issueTracker');
class Issue extends vscode.TreeItem {
    constructor(label, description, collapsibleState, issueNumber, line, lineNumber, isParent, gitLabLink) {
        super(label, collapsibleState);
        this.label = label;
        this.description = description;
        this.collapsibleState = collapsibleState;
        this.issueNumber = issueNumber;
        this.line = line;
        this.lineNumber = lineNumber;
        this.isParent = isParent;
        this.gitLabLink = gitLabLink;
        this.iconPath = {
            light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg'),
        };
        this.tooltip = `${this.label}-${this.issueNumber}`;
        // this.description = this.issueNumber;
    }
}
exports.Issue = Issue;
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
        const localFileName = fileName.replace(workspaceRoot, '.');
        const rl = readline.createInterface({
            input: fs.createReadStream(fileName),
            crlfDelay: Infinity,
        });
        const issues = [];
        let lineNumber = 0;
        rl.on('line', (line) => {
            lineNumber++;
            const loweredCasedLine = line.toLowerCase();
            if (loweredCasedLine.includes('issue:')) {
                const splitStringBeforeIssue = line.split('(ISSUE:');
                const issueNumber = splitStringBeforeIssue[1].replace(')', '').replace('#', '');
                const issueComment = splitStringBeforeIssue[0].split('//')[1];
                const issueLabel = `ISSUE:#${issueNumber}: ${issueComment}`;
                const issueDescription = `${localFileName} - ${lineNumber} `;
                const isParent = true;
                const issue = new Issue(issueLabel, issueDescription, vscode.TreeItemCollapsibleState.Collapsed, issueNumber, issueComment, lineNumber, isParent);
                issues.push(issue);
            }
        });
        yield events_1.once(rl, 'close');
        return issues;
    }));
    return exports.flattenOnce(issueItems);
});
// export const convertTodoItems = async (workspaceRoot: string) => {
//   const dirItems = getAllFiles(workspaceRoot, []);
//   // const dirItems = ['C:/Users/Amir/Documents/Rentsync/billing-system/src/tools/mail/sendgrid.ts'];
//   // TODO:
//   const files = await mapAsync(dirItems, async (file: string, i: number) => {
//     const fileName = file.replace(/\\/g, '/');
//     issueOutput.appendLine(`file ${fileName}`);
//     const rl = readline.createInterface({
//       input: fs.createReadStream(fileName),
//       crlfDelay: Infinity,
//     });
//     let replacementFile: string = '';
//     let madeChange = false;
//     let lineNumber = 0;
//     // rl.on('line', async (line: string) => {
//     // eslint-disable-next-line no-restricted-syntax
//     for await (const line of rl) {
//       lineNumber++;
//       const containsTODO = line.toLowerCase().includes('todo:') || line.toLowerCase().includes('todo');
//       let replacementLine = line;
//       if (containsTODO) {
//         madeChange = true;
//         const title = line
//           .replace('//', '')
//           .replace('todo:', '')
//           .replace('TODO:', '')
//           .replace('todo', '')
//           .replace('TODO', '');
//         const description = `File: ${file} \n\n Line: ${lineNumber}`;
//         const issue = JSON.parse(await createIssue(title, description));
//         const issueNumber = issue.iid;
//         replacementLine = line
//           .replace('todo:', `ISSUE:#${issueNumber}:`)
//           .replace('TODO:', `ISSUE:#${issueNumber}:`)
//           .replace('todo', `ISSUE:#${issueNumber}:`)
//           .replace('TODO', `ISSUE:#${issueNumber}:`);
//         issueOutput.appendLine(replacementLine);
//       }
//       replacementFile += `${replacementLine}\n`;
//     }
//     // });
//     // await once(rl, 'close');
//     rl.close();
//     if (madeChange) {
//       fs.writeFileSync(fileName, replacementFile);
//       issueOutput.appendLine(`${lineNumber} ${file}`);
//       // write replacement file
//     }
//   });
// };
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
                const gitlabLink = `${settings.get('gitLabProjectURL')}/-/issues/${element.issueNumber}`;
                const item = new Issue(`View in Gitlab`, gitlabLink, vscode.TreeItemCollapsibleState.None, element.issueNumber, element.line, element.lineNumber, false, gitlabLink);
                item.command = {
                    command: "issues.openGitlabLink",
                    title: "Select Node",
                    arguments: [item]
                };
                return [item];
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