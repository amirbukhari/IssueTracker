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
import { mapAsync } from '@jamesgmarks/utilities';
import { createIssue } from './gitlabApi';

const issueOutput = window.createOutputChannel('IssueTracke2r');

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
    public gitLabLink?: string
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}-${this.issueNumber}`;
    // this.description = this.issueNumber;
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
  const foldersToIgnore = ['node_modules', '.vscode'];
  const files = fs.readdirSync(dirPath);

  let _arrayOfFiles = arrayOfFiles || [];

  files.forEach((file) => {
    issueOutput.appendLine(`file ${file}`);
    if (fs.statSync(`${dirPath}/${file}`).isDirectory()) {
      _arrayOfFiles = (
        !foldersToIgnore.includes(`${file}`)
          ? getAllFiles(`${dirPath}/${file}`, _arrayOfFiles)
          : _arrayOfFiles
      );
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
    const localFileName = fileName.replace(workspaceRoot,'.');

    const rl = readline.createInterface({
      input: fs.createReadStream(fileName),
      crlfDelay: Infinity,
    });
    const issues: Issue[] = [];
    let lineNumber = 0;
    rl.on('line', (line: string) => {
      lineNumber++;
      const loweredCasedLine = line.toLowerCase();
      if (loweredCasedLine.includes('issue:')) {
        const splitStringBeforeIssue = line.split('(ISSUE:');
        const issueNumber = splitStringBeforeIssue[1].replace(')','').replace('#','');
        const issueComment = splitStringBeforeIssue[0].split('//')[1];
        const issueLabel = `ISSUE:#${issueNumber}: ${issueComment}`;
        const issueDescription = `${localFileName} - ${lineNumber} `;
        const isParent = true;
        const issue = new Issue(
          issueLabel,
          issueDescription,
          vscode.TreeItemCollapsibleState.Collapsed,
          issueNumber,
          issueComment,
          lineNumber,
          isParent
        );
        issues.push(issue);
      }
    });
    await once(rl, 'close');
    return issues;
  });

  return flattenOnce(issueItems);
};

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
      const gitlabLink  = `${settings.get('gitLabProjectURL')}/-/issues/${element.issueNumber}`;
      const item = new Issue(
        `View in Gitlab`,
        gitlabLink,
        vscode.TreeItemCollapsibleState.None,
        element.issueNumber,
        element.line,
        element.lineNumber,
        false,
        gitlabLink
      );
      item.command = {
        command: "issues.openGitlabLink",
        title: "Select Node",
        arguments: [item]
    };
      return [item];
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
