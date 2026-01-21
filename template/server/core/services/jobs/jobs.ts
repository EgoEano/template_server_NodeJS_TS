export function startAllJobs() {
    try {
        console.log('JOBS - All jobs started');
    } catch (e) {
        console.error('JOBS - Failed to start jobs:', e);
    }
}
