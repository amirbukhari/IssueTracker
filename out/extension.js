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
const openEditorLink = (uri, item) => __awaiter(void 0, void 0, void 0, function* () {
    const openEditor = yield vscode_1.commands.executeCommand('vscode.open', uri);
    const scrollToLine = yield vscode_1.commands.executeCommand('revealLine', {
        lineNumber: item.lineNumber,
        at: 'center'
    });
});
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    const issueProvider = new issues.IssuesProvider(vscode_1.workspace.rootPath || './');
    vscode_1.window.registerTreeDataProvider('issues', issueProvider);
    vscode_1.commands.registerCommand("issues.openGitlabLink", (item) => {
        var _a, _b;
        vscode_1.window.showInformationMessage((_a = item.gitLabLink) !== null && _a !== void 0 ? _a : '');
        vscode_1.env.openExternal(vscode_1.Uri.parse((_b = item.gitLabLink) !== null && _b !== void 0 ? _b : ''));
    });
    vscode_1.commands.registerCommand("issues.openEditorLink", (item) => {
        var _a;
        const uriString = `${vscode_1.workspace.rootPath}${(_a = item.fileName) === null || _a === void 0 ? void 0 : _a.replace('.', '')}`;
        const uri = vscode_1.Uri.file(`${uriString}`);
        vscode_1.window.showInformationMessage(`${uriString}`);
        openEditorLink(uri, item);
    });
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "issuetracker" is now active!');
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    const disposableHelloWorld = vscode_1.commands.registerCommand('issuetracker.helloWorld', () => {
        vscode_1.window.showInformationMessage('Hello World from issuetracker!');
    });
    const disposableRefreshEntry = vscode_1.commands.registerCommand('issueTracker.refreshEntry', () => issueProvider.refresh());
    context.subscriptions.push(disposableHelloWorld);
    context.subscriptions.push(disposableRefreshEntry);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map