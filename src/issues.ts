/* eslint-disable no-empty-function */
/* eslint-disable class-methods-use-this */
// eslint-disable-next-line max-classes-per-file
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { window, workspace } from 'vscode';
import { resolve } from 'path';
import * as readline from 'readline';
import { once } from 'events';
import { flattenOnce, mapAsync, mapAsyncSequential } from '@jamesgmarks/utilities';
import { getAllFiles } from './helpers';

const issueOutput = window.createOutputChannel('IssueTracker');

const settings = workspace.getConfiguration('issueTracker');

export class Issue extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public description: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public issueNumber?: string,
    public line?: string,
    public lineNumber?: number,
    public isParent?: boolean,
    public gitLabLink?: string | null,
    public fileName?: string,
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}-${this.issueNumber}`;
  }

  iconPath = {
    light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
    dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg'),
  };
}






const getIssueItems = async (workspaceRoot: string): Promise<Issue[]> => {
  const dirItems = getAllFiles(workspaceRoot);
  issueOutput.appendLine(`GOT ALL FILES`);

  const issueItems = await mapAsync(dirItems, async (file: string, i: number) => {
    const fileName = file.replace(/\\/g, '/');
    const localFileName = fileName.replace(workspaceRoot, '.');

    issueOutput.appendLine(`READING FILE ${localFileName}`);


    const rl = readline.createInterface({
      input: fs.createReadStream(fileName),
      crlfDelay: Infinity,
    });
    const issues: Issue[] = [];
    let lineNumber = 0;

    rl.on('line', (line: string) => {
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
        const issue = new Issue(
          issueLabel,
          issueDescription,
          vscode.TreeItemCollapsibleState.Collapsed,
          issueNumber,
          issueComment,
          lineNumber,
          isParent,
          null,
          localFileName
        );
        issues.push(issue);
      }
    });
    rl.on('close', (error: any) => {
      issueOutput.appendLine(`FINISHED READING FILE ${localFileName}`);
    });
    await once(rl, 'close');
    return issues;
  });

  return flattenOnce(issueItems);
};


export class IssuesProvider implements vscode.TreeDataProvider<Issue> {
  // eslint-disable-next-line no-useless-constructor
  private workspaceRoot: string;
  constructor(private _workspaceRoot: string) {
    this.workspaceRoot = _workspaceRoot;
    // issueOutput.appendLine(this.workspaceRoot);
  }
  getTreeItem(element: Issue): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: Issue): Promise<Issue[]> {
    if (element) {
      const gitlabLink = `${settings.get('gitLabProjectURL')}/-/issues/${element.issueNumber}`;
      const gitlabLinkItem = new Issue(
        `View in Gitlab`,
        gitlabLink,
        vscode.TreeItemCollapsibleState.None,
        element.issueNumber,
        element.line,
        element.lineNumber,
        false,
        gitlabLink,
        element.fileName
      );
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
  }

  private _onDidChangeTreeData: vscode.EventEmitter<Issue | undefined | null | void> = (
    new vscode.EventEmitter<Issue | undefined | null | void>()
  );

  readonly onDidChangeTreeData: vscode.Event<Issue | undefined | null | void> = (
    this._onDidChangeTreeData.event
  );

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}
