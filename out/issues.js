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
// import { createIssue } from './gitlabApi';
const issueOutput = vscode_1.window.createOutputChannel('IssueTracker');
const settings = vscode_1.workspace.getConfiguration('issueTracker');
class Issue extends vscode.TreeItem {
    constructor(label, description, collapsibleState, issueNumber, line, lineNumber, isParent, gitLabLink, fileName) {
        super(label, collapsibleState);
        this.label = label;
        this.description = description;
        this.collapsibleState = collapsibleState;
        this.issueNumber = issueNumber;
        this.line = line;
        this.lineNumber = lineNumber;
        this.isParent = isParent;
        this.gitLabLink = gitLabLink;
        this.fileName = fileName;
        this.iconPath = {
            light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg'),
        };
        this.tooltip = `${this.label}-${this.issueNumber}`;
    }
}
exports.Issue = Issue;
const flattenOnce = (usageOrCostArray) => (usageOrCostArray.reduce((acc, curr) => [...acc, ...curr], []));
exports.flattenOnce = flattenOnce;
const getAllFiles = (dirPath, arrayOfFiles) => {
    var _a, _b;
    const foldersToIgnore = (_a = settings.get('foldersToIgnore')) !== null && _a !== void 0 ? _a : [];
    const files = fs.readdirSync(dirPath);
    const pathFromWorkspaceRoot = dirPath.replace((_b = vscode_1.workspace.rootPath) !== null && _b !== void 0 ? _b : '', '');
    let _arrayOfFiles = arrayOfFiles || [];
    files.forEach((file) => {
        if (fs.statSync(`${dirPath}/${file}`).isDirectory()) {
            issueOutput.appendLine(`.${pathFromWorkspaceRoot}/${file}`);
            _arrayOfFiles = (!foldersToIgnore.includes(`.${pathFromWorkspaceRoot}/${file}`)
                ? getAllFiles(`${dirPath}/${file}`, _arrayOfFiles)
                : _arrayOfFiles);
        }
        else if (file.includes('.ts')) {
            issueOutput.appendLine(`.${pathFromWorkspaceRoot}/${file}`);
            _arrayOfFiles.push(path.join(dirPath, '/', file));
        }
    });
    return arrayOfFiles;
};
const getIssueItems = (workspaceRoot) => __awaiter(void 0, void 0, void 0, function* () {
    const dirItems = getAllFiles(workspaceRoot, []);
    issueOutput.appendLine(`GOT ALL FILES`);
    const issueItems = yield utilities_1.mapAsync(dirItems, (file, i) => __awaiter(void 0, void 0, void 0, function* () {
        const fileName = file.replace(/\\/g, '/');
        const localFileName = fileName.replace(workspaceRoot, '.');
        issueOutput.appendLine(`READING FILE ${localFileName}`);
        const rl = readline.createInterface({
            input: fs.createReadStream(fileName),
            crlfDelay: Infinity,
        });
        const issues = [];
        let lineNumber = 0;
        rl.on('line', (line) => {
            issueOutput.appendLine(` READING FILE line ${lineNumber} - ${localFileName}`);
            lineNumber++;
            const loweredCasedLine = line.toLowerCase();
            if (line.includes('(ISSUE:')) {
                const splitStringBeforeIssue = line.split('(ISSUE:');
                const issueNumber = splitStringBeforeIssue[1].replace(')', '').replace('#', '');
                const issueComment = splitStringBeforeIssue[0].split('//')[1];
                const issueLabel = `ISSUE:#${issueNumber}: ${issueComment}`;
                const issueDescription = `${localFileName} - ${lineNumber} `;
                issueOutput.appendLine(localFileName);
                const isParent = true;
                const issue = new Issue(issueLabel, issueDescription, vscode.TreeItemCollapsibleState.Collapsed, issueNumber, issueComment, lineNumber, isParent, null, localFileName);
                issues.push(issue);
            }
        });
        rl.on('close', (error) => {
            issueOutput.appendLine(`FINISHED READING FILE ${localFileName}`);
        });
        rl.on('pause', () => {
            console.log('Readline paused.');
        });
        yield events_1.once(rl, 'close');
        return issues;
    }));
    return exports.flattenOnce(issueItems);
});
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
                const gitlabLinkItem = new Issue(`View in Gitlab`, gitlabLink, vscode.TreeItemCollapsibleState.None, element.issueNumber, element.line, element.lineNumber, false, gitlabLink, element.fileName);
                gitlabLinkItem.command = {
                    command: "issues.openGitlabLink",
                    title: "Select Node",
                    arguments: [gitlabLinkItem]
                };
                const vscodeDescription = `${element.fileName} - ${element.lineNumber}`;
                const vscodeLinkItem = new Issue(`View in Editor`, vscodeDescription, vscode.TreeItemCollapsibleState.None, element.issueNumber, element.line, element.lineNumber, false, gitlabLink, element.fileName);
                vscodeLinkItem.command = {
                    command: "issues.openEditorLink",
                    title: "Select Node",
                    arguments: [vscodeLinkItem]
                };
                return [gitlabLinkItem, vscodeLinkItem];
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