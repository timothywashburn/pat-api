// this was traumatizing I hope I never have to open this file again

let lastLog = 0;
export const logMemory = () => {
    const used = process.memoryUsage();
    console.log(
        `log ${lastLog}: memory usage: ` +
        `heap used: ${formatBytes(used.heapUsed)} / ${formatBytes(used.heapTotal)} | ` +
        `rss: ${formatBytes(used.rss)} | ` +
        `external: ${formatBytes(used.external)}`
    );
    lastLog++;
}

function formatBytes(bytes: number) {
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}