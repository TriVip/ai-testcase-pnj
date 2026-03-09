const test = async () => {
    try {
        const response = await fetch('http://localhost:9999/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'testuser', password: 'password123' })
        });
        const loginData = await response.json();
        const token = loginData.token;
        const cookie = response.headers.get('set-cookie') || '';

        console.log("Logged in. Creating workspace...");
        const createRes = await fetch('http://localhost:9999/api/workspaces', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookie,
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name: 'My New Workspace' })
        });
        const createData = await createRes.json();
        console.log("Status:", createRes.status);
        console.log("Response:", createData);
    } catch (e) {
        console.error("Error:", e.message);
    }
};
test();
