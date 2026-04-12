(async () => {
    try {
        const auth = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login: 'admin', senha: 'admin123' })
        });
        const authData = await auth.json();
        
        if (auth.status !== 200) {
            console.log('Login failed', authData);
            return;
        }
        
        var token = authData.token;
        console.log('Got token');

        // Check clients
        const clientsRes = await fetch('http://localhost:3000/api/cliente', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const clientsData = await clientsRes.json();
        let clientId = clientsData[0]?.cliId || clientsData[0]?.cli_id;
        
        console.log('Clients count:', clientsData.length);

        if (!clientId) {
            console.log('No clients available to test!');
            return;
        }
        
        console.log('Using client ID:', clientId);

        // Try getting history
        const getRes = await fetch(`http://127.0.0.1:3000/api/valor-hora?cliId=${clientId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Valor Hora GET Status:', getRes.status);
        console.log(await getRes.json());
        
    } catch (e) {
        console.log('ERROR:', e.message);
    }
})();
