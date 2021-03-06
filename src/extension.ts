
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {
	ExtensionContext, commands, window, workspace, env, Uri,

} from 'vscode';

import fetch from 'node-fetch';
import { Hash } from '@jamesgmarks/utilities';
import * as issues from './issues';
import { createIssue, getIssues } from './gitlabApi';
// import { convertTodoItems } from './issues';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
	const issueProvider = new issues.IssuesProvider(workspace.rootPath || './');
	window.registerTreeDataProvider('issues', issueProvider);
	commands.registerCommand("issues.openGitlabLink", (item:issues.Issue) => {
		console.log(item.label);
		window.showInformationMessage(item.gitLabLink ?? '');
		env.openExternal(Uri.parse(item.gitLabLink ?? ''));
});

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "issuetracker" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = commands.registerCommand('issuetracker.helloWorld', () => {
		window.showInformationMessage('Hello World from issuetracker!');
	});

	// const disposableTwo = commands.registerCommand('issuetracker.convertTodoItems', async () => {
	// 	await convertTodoItems(workspace.rootPath || './');
	// 	// Display a message box to the user
	// 	window.showInformationMessage('converting todo items!');
	// });

	// Create output channel
	const issueOutput = window.createOutputChannel('IssueTracker');

	const disposableThree = commands.registerCommand('issuetracker.createIssue', async () => {
		issueOutput.appendLine(`PAT ${process.env.PAT}`);
		const data = await createIssue('test', 'test');

		// Display a message box to the user
		window.showInformationMessage('createIssue from issuetracker!');
		window.showInformationMessage(`test ${data}}`);

		// Write to output.
		issueOutput.appendLine(`msg: ${data}`);
	});

	const disposableFour = commands.registerCommand('issuetracker.getIssues', async () => {
		const data = await getIssues();
		const issueTitles = JSON.stringify(data.map((d: any) => ({
			issue: d.title,
			state: d.state,
			description: d.description,
			labels: d.labels,
		})));

		// Display a message box to the user
		window.showInformationMessage('get issues from issuetracker!');
		window.showInformationMessage(`test ${data}`);

		// Write to output.
		issueOutput.appendLine(issueTitles);
	});

	const disposableFive = commands.registerCommand('issueTracker.refreshEntry', () => issueProvider.refresh());

	context.subscriptions.push(disposable);
	// context.subscriptions.push(disposableTwo);
	context.subscriptions.push(disposableThree);
	context.subscriptions.push(disposableFour);
	context.subscriptions.push(disposableFive);
}

// this method is called when your extension is deactivated
export function deactivate() { }
