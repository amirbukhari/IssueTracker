
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {
	ExtensionContext, commands, window, workspace, env, Uri, Location,
} from 'vscode';

import * as issues from './issues';


const openEditorLink = async (uri: Uri, item: issues.Issue) => {
	const openEditor = await commands.executeCommand<Location[]>(
		'vscode.open',
		uri
	)
	const scrollToLine = await commands.executeCommand<Location[]>(
		'revealLine',
		{
			lineNumber: item.lineNumber,
			at: 'center'
		}
	);
}



// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
	const issueProvider = new issues.IssuesProvider(workspace.rootPath || './');
	window.registerTreeDataProvider('issues', issueProvider);

	commands.registerCommand("issues.openGitlabLink", (item: issues.Issue) => {
		window.showInformationMessage(item.gitLabLink ?? '');
		env.openExternal(Uri.parse(item.gitLabLink ?? ''));
	});

	commands.registerCommand("issues.openEditorLink", (item: issues.Issue) => {
		const uriString = `${workspace.rootPath}${item.fileName?.replace('.', '')}`;
		const uri = Uri.file(`${uriString}`);
		window.showInformationMessage(`${uriString}`);
		openEditorLink(uri, item);

	});
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "issuetracker" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposableHelloWorld = commands.registerCommand('issuetracker.helloWorld', () => {
		window.showInformationMessage('Hello World from issuetracker!');
	});


	const disposableRefreshEntry = commands.registerCommand('issueTracker.refreshEntry', () => issueProvider.refresh());

	context.subscriptions.push(disposableHelloWorld);
	context.subscriptions.push(disposableRefreshEntry);
}

// this method is called when your extension is deactivated
export function deactivate() { }
