(async () => {
    try {
        const res = await fetch('http://localhost:3000/api/valor-hora', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                vhCliId: 1,
                vhValor: 155.50,
                vhMesInicio: "2026-04-08"
            })
        });
        const data = await res.json();
        console.log(res.status);
        console.log(data);
    } catch (e) {
        console.log(e.message);
    }
})();
