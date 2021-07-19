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
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode_1 = require("vscode");
const issues = require("./issues");
const gitlabApi_1 = require("./gitlabApi");
const issues_1 = require("./issues");
const issueOutput = vscode_1.window.createOutputChannel('IssueTrac3ke2r');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    const issueProvider = new issues.IssuesProvider(vscode_1.workspace.rootPath || './');
    vscode_1.window.registerTreeDataProvider('issues', issueProvider);
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "issuetracker" is now active!');
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    const disposable = vscode_1.commands.registerCommand('issuetracker.helloWorld', () => {
        vscode_1.window.showInformationMessage('Hello World from issuetracker!');
    });
    const disposableTwo = vscode_1.commands.registerCommand('issuetracker.convertTodoItems', () => __awaiter(this, void 0, void 0, function* () {
        yield issues_1.convertTodoItems(vscode_1.workspace.rootPath || './');
        // Display a message box to the user
        vscode_1.window.showInformationMessage('converting todo items!');
    }));
    // Create output channel
    const issueOutput = vscode_1.window.createOutputChannel('IssueTracker');
    const disposableThree = vscode_1.commands.registerCommand('issuetracker.createIssue', () => __awaiter(this, void 0, void 0, function* () {
        issueOutput.appendLine(`PAT ${process.env.PAT}`);
        const data = yield gitlabApi_1.createIssue('test', 'test');
        // Display a message box to the user
        vscode_1.window.showInformationMessage('createIssue from issuetracker!');
        vscode_1.window.showInformationMessage(`test ${data}}`);
        // Write to output.
        issueOutput.appendLine(`msg: ${data}`);
    }));
    const disposableFour = vscode_1.commands.registerCommand('issuetracker.getIssues', () => __awaiter(this, void 0, void 0, function* () {
        const data = yield gitlabApi_1.getIssues();
        const issueTitles = JSON.stringify(data.map((d) => ({
            issue: d.title,
            state: d.state,
            description: d.description,
            labels: d.labels,
        })));
        // Display a message box to the user
        vscode_1.window.showInformationMessage('get issues from issuetracker!');
        vscode_1.window.showInformationMessage(`test ${data}`);
        // Write to output.
        issueOutput.appendLine(issueTitles);
    }));
    const disposableFive = vscode_1.commands.registerCommand('issueTracker.refreshEntry', () => issueProvider.refresh());
    context.subscriptions.push(disposable);
    context.subscriptions.push(disposableTwo);
    context.subscriptions.push(disposableThree);
    context.subscriptions.push(disposableFour);
    context.subscriptions.push(disposableFive);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map