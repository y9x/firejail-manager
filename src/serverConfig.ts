import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

let vscodeProductJson: Record<string, unknown>;

async function getVSCodeProductJson() {
    if (!vscodeProductJson) {
        const productJsonStr = await fs.promises.readFile(path.join(vscode.env.appRoot, 'product.json'), 'utf8');
        vscodeProductJson = JSON.parse(productJsonStr);
    }

    return vscodeProductJson;
}

export type ServerVersion = 'closest' | 'latest' | 'match' | string;
export type ServerValidation = 'force' | 'skip' | 'strict';

export type IServerConfig = {
    version: string;
    commit: string;
    quality: string;
    release: string;
    serverApplicationName: string;
    serverDataFolderName: string;
    serverDownloadUrlTemplate?: string;
    serverValidation: ServerValidation;
    ideVersion?: string;
};

export async function getVSCodeServerConfig(): Promise<IServerConfig> {
    const productJson = await getVSCodeProductJson();

    const customServerBinaryName = vscode.workspace.getConfiguration('remote.SSH').get<string>('serverBinaryName', '');
    const serverValidation = vscode.workspace.getConfiguration('remote.SSH').get<ServerValidation>('serverValidation', 'strict');

    const rawTemplate = (productJson.serverDownloadUrlTemplate as string) 
        || vscode.workspace.getConfiguration('remote.antigravitySSH.experimental').get<string>('serverDownloadUrlTemplate') 
        || vscode.workspace.getConfiguration('remote.SSH.experimental').get<string>('serverDownloadUrlTemplate');

    let serverDownloadUrlTemplate = rawTemplate;
    if (productJson.applicationName === 'antigravity' && rawTemplate && rawTemplate.includes('codeiumdata.com')) {
        serverDownloadUrlTemplate = 'https://edgedl.me.gvt1.com/edgedl/release2/j0qc3/antigravity/${quality}/${ideVersion}-${commit}/${os}-${arch}/Antigravity-reh.tar.gz';
    } else if (productJson.applicationName === 'cursor' && !rawTemplate) {
        serverDownloadUrlTemplate = 'https://cursor.blob.core.windows.net/remote-releases/${commit}/vscode-reh-${os}-${arch}.tar.gz';
    }

    return {
        version: vscode.version.replace('-insider',''),
        commit: productJson.commit as string,
        quality: productJson.quality as string,
        release: productJson.release as string || '',
        serverApplicationName: customServerBinaryName || (productJson.serverApplicationName as string) || (productJson.applicationName === 'cursor' ? 'cursor-server' : 'code-server'),
        serverDataFolderName: (productJson.serverDataFolderName as string) || (productJson.applicationName === 'cursor' ? '.cursor-server' : '.vscode-server'),
        serverDownloadUrlTemplate,
        serverValidation,
        ideVersion: (productJson.ideVersion || productJson.vscodeVersion) as string,
    };
}
