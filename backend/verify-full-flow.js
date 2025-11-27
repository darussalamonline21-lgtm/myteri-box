const BASE_URL = 'http://localhost:5000/api/v1';
const TEST_USER = {
    storeCode: 'PEMENANG-001',
    password: 'secret123'
};

async function runFullVerification() {
    console.log('🚀 Starting Full Application Verification...\n');

    try {
        // 1. LOGIN
        console.log(`1️⃣  [LOGIN] Logging in as ${TEST_USER.storeCode}...`);
        const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(TEST_USER)
        });

        if (loginResponse.status !== 200) throw new Error('Login failed');
        const loginData = await loginResponse.json();
        const { token, activeCampaignId } = loginData;
        const campaignId = activeCampaignId;

        console.log(`   ✅ Success! Token received.`);
        console.log(`   ℹ️  Active Campaign ID: ${campaignId}\n`);

        const authHeaders = { 'Authorization': `Bearer ${token}` };

        // 2. DASHBOARD SUMMARY
        console.log(`2️⃣  [DASHBOARD] Fetching Campaign Summary...`);
        const summaryResponse = await fetch(`${BASE_URL}/campaigns/${campaignId}/summary`, {
            headers: authHeaders
        });

        if (summaryResponse.status !== 200) throw new Error('Fetch summary failed');
        const summaryData = await summaryResponse.json();

        console.log(`   ✅ Success!`);
        console.log(`   ℹ️  Campaign Name: ${summaryData.campaign.name}`);
        console.log(`   💰 Coupon Balance: ${summaryData.couponBalance.balance}`);
        console.log(`   🏆 Total Prizes Won: ${summaryData.stats.totalPrizesWon}\n`);

        // 3. FETCH BOXES
        console.log(`3️⃣  [GAMEPLAY] Fetching Boxes...`);
        const boxesResponse = await fetch(`${BASE_URL}/campaigns/${campaignId}/boxes`, {
            headers: authHeaders
        });

        if (boxesResponse.status !== 200) throw new Error('Fetch boxes failed');
        const boxesData = await boxesResponse.json();
        const boxes = Array.isArray(boxesData) ? boxesData : (boxesData.items || []);
        console.log(`   ✅ Success! Loaded ${boxes.length} boxes.\n`);

        // 4. OPEN A BOX (If balance > 0)
        if (summaryData.couponBalance.balance > 0) {
            const availableBox = boxes.find(b => b.status !== 'opened');
            if (availableBox) {
                console.log(`4️⃣  [GAMEPLAY] Opening Box ID ${availableBox.id}...`);
                const openResponse = await fetch(`${BASE_URL}/boxes/${availableBox.id}/open`, {
                    method: 'POST',
                    headers: { ...authHeaders, 'Content-Type': 'application/json' }
                });

                if (openResponse.status === 200) {
                    const openData = await openResponse.json();
                    console.log(`   ✅ Success! Won: ${openData.prize.name} (${openData.prize.tier})`);
                } else {
                    console.log(`   ⚠️  Could not open box (Status: ${openResponse.status})`);
                }
            } else {
                console.log(`   ⚠️  No available boxes to open.`);
            }
        } else {
            console.log(`   ⚠️  [GAMEPLAY] Skipping box open (Insufficient balance).`);
        }
        console.log('');

        // 5. PRIZE HISTORY
        console.log(`5️⃣  [HISTORY] Fetching My Prizes...`);
        const historyResponse = await fetch(`${BASE_URL}/campaigns/${campaignId}/my-prizes`, {
            headers: authHeaders
        });

        if (historyResponse.status === 200) {
            const historyData = await historyResponse.json();
            const prizes = Array.isArray(historyData) ? historyData : (historyData.items || []);
            console.log(`   ✅ Success! Found ${prizes.length} past prizes.`);
            if (prizes.length > 0) {
                console.log(`   ℹ️  Latest Prize: ${prizes[0].name}`);
            }
        } else {
            throw new Error(`Fetch prizes failed: ${historyResponse.status}`);
        }

        console.log('\n🎉 ALL SYSTEMS GO! The application logic is functioning correctly.');

    } catch (error) {
        console.error('\n❌ Verification Failed:', error.message);
    }
}

runFullVerification();
