const Logger = {
    logs:[],
    log: function(msg) {
        const time = new Date().toISOString().split('T')[1].slice(0, -1);
        const line = `[${time}] ${msg}`;
        this.logs.push(line);
        console.log(line);
    },
    download: function() {
        const blob = new Blob([this.logs.join('\n')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tank_log.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        this.log("Лог-файл скачан пользователем.");
    }
};

window.onerror = function(msg, url, line) {
    Logger.log(`КРИТИЧЕСКАЯ ОШИБКА: ${msg} (Строка: ${line})`);
};