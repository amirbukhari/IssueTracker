/* eslint-disable no-empty-function */
/* eslint-disable class-methods-use-this */
/* eslint-disable import/no-unresolved */
// eslint-disable-next-line max-classes-per-file
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { window, workspace } from 'vscode';
import { resolve } from 'path';
import * as readline from 'readline';
import { once } from 'events';
import { mapAsync } from '@jamesgmarks/utilities';
import { createIssue } from './gitlabApi';

const issueOutput = window.createOutputChannel('IssueTracke2r');

class Issue extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private issueNumber: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public line?: string,
    public lineNumber?: number,
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}-${this.issueNumber}`;
    this.description = this.issueNumber;
  }

  iconPath = {
    light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
    dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg'),
  };
}

export const flattenOnce = <T>(usageOrCostArray: Array<Array<T>>): T[] => (
  usageOrCostArray.reduce((acc, curr) => [...acc, ...curr], [])
);

const getAllFiles = (dirPath: string, arrayOfFiles: string[]) => {
  const files = fs.readdirSync(dirPath);

  let _arrayOfFiles = arrayOfFiles || [];

  files.forEach((file) => {
    if (fs.statSync(`${dirPath}/${file}`).isDirectory()) {
      _arrayOfFiles = getAllFiles(`${dirPath}/${file}`, _arrayOfFiles);
    } else if (file.includes('.ts')) {
      _arrayOfFiles.push(path.join(dirPath, '/', file));
    }
  });

  return arrayOfFiles;
};

const getIssueItems = async (workspaceRoot: string): Promise<Issue[]> => {
  const dirItems = getAllFiles(workspaceRoot, []);

  const issueItems = await mapAsync(dirItems, async (file: string, i: number) => {
    const fileName = file.replace(/\\/g, '/');
    // issueOutput.appendLine(`file ${fileName}`);

    const rl = readline.createInterface({
      input: fs.createReadStream(fileName),
      crlfDelay: Infinity,
    });
    const issues: Issue[] = [];
    let lineNumber = 0;
    rl.on('line', (line: string) => {
      lineNumber++;
      const containsIssue = line.toLowerCase().includes('issue:');
      if (containsIssue) {
        const splitString = line.split(':');
        const issueNumber = splitString[1];

        const issue = new Issue(
          `issue ${issueNumber}`,
          `${i}`,
          vscode.TreeItemCollapsibleState.Collapsed,
          line,
          lineNumber,
        );
        issues.push(issue);
      }
    });
    await once(rl, 'close');
    return issues;
  });

  return flattenOnce(issueItems);
};

export const convertTodoItems = async (workspaceRoot: string) => {
  const dirItems = getAllFiles(workspaceRoot, []);
  // const dirItems = ['C:/Users/Amir/Documents/Rentsync/billing-system/src/tools/mail/sendgrid.ts'];
  // TODO:
  const files = await mapAsync(dirItems, async (file: string, i: number) => {
    const fileName = file.replace(/\\/g, '/');
    issueOutput.appendLine(`file ${fileName}`);

    const rl = readline.createInterface({
      input: fs.createReadStream(fileName),
      crlfDelay: Infinity,
    });
    let replacementFile: string = '';
    let madeChange = false;
    let lineNumber = 0;
    // rl.on('line', async (line: string) => {
    // eslint-disable-next-line no-restricted-syntax
    for await (const line of rl) {
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
        const issue = JSON.parse(await createIssue(title, description));
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
    // });

    // await once(rl, 'close');
    rl.close();
    if (madeChange) {
      fs.writeFileSync(fileName, replacementFile);
      issueOutput.appendLine(`${lineNumber} ${file}`);
      // write replacement file
    }
  });
};

export class IssuesProvider implements vscode.TreeDataProvider<Issue> {
  // eslint-disable-next-line no-useless-constructor
  private workspaceRoot;
  constructor(private _workspaceRoot: string) {
    this.workspaceRoot = _workspaceRoot;
    // issueOutput.appendLine(this.workspaceRoot);
  }
  getTreeItem(element: Issue): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: Issue): Promise<Issue[]> {
    if (element) {
      return [new Issue(
        `Line#/View in Gitlab`,
        `https://gitlab.com/llws/platform/billing-system/-/issues/${element.description}`,
        vscode.TreeItemCollapsibleState.None,
      )];
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
