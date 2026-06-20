// Включает коммитимые git-хуки (core.hooksPath -> scripts/hooks). Запускается
// автоматически из npm "prepare" при `npm install`. Если не git-репозиторий — молча пропускает.
const { execSync } = require('child_process');
try {
    execSync('git config core.hooksPath scripts/hooks', { stdio: 'ignore' });
    console.log('git hooks enabled (core.hooksPath=scripts/hooks)');
} catch (e) {
    // не в git-репозитории (например, установка из тарбола) — ничего не делаем
}
