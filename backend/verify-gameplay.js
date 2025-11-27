const BASE_URL = 'http://localhost:5000/api/v1';
const TEST_USER = {
    storeCode: 'PEMENANG-001',
    password: 'secret123'
};

async function runGameplayVerification() {
    console.log('🚀 Starting Gameplay Verification Script...\n');

    try {
        // 1. LOGIN
        console.log(`1️⃣  Logging in as ${TEST_USER.storeCode}...`);
        const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(TEST_USER)
        });

        if (loginResponse.status !== 200) {
            throw new Error(`Login failed: ${loginResponse.status} - ${await loginResponse.text()}`);
        }

        const loginData = await loginResponse.json();
        const { token, activeCampaignId } = loginData;

        if (!token || !activeCampaignId) {
            throw new Error('Login response missing token or activeCampaignId');
        }

        console.log(`✅ Login successful! Token received.`);
        console.log(`ℹ️  Active Campaign ID: ${activeCampaignId}\n`);

        // 2. FETCH BOXES
        console.log(`2️⃣  Fetching boxes for Campaign ${activeCampaignId}...`);
        const boxesResponse = await fetch(`${BASE_URL}/campaigns/${activeCampaignId}/boxes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (boxesResponse.status !== 200) {
            throw new Error(`Fetch boxes failed: ${boxesResponse.status} - ${await boxesResponse.text()}`);
        }

        const boxesData = await boxesResponse.json();
        // Handle both array directly or { items: [...] } structure
        const boxes = Array.isArray(boxesData) ? boxesData : (boxesData.items || []);

        console.log(`✅ Fetched ${boxes.length} boxes.`);

        // 3. FIND AVAILABLE BOX
        // Assuming 'status' field exists and 'open' means available, or we check if it's not 'opened'
        // Based on frontend: b.status === 'opened' means opened.
        const availableBox = boxes.find(b => b.status !== 'opened');

        if (!availableBox) {
            console.log('⚠️  No available boxes to open. All boxes might be opened already.');
            return;
        }

        console.log(`ℹ️  Found available box ID: ${availableBox.id} (Status: ${availableBox.status})\n`);

        // 4. OPEN BOX
        console.log(`3️⃣  Attempting to open Box ${availableBox.id}...`);
        const openBoxResponse = await fetch(`${BASE_URL}/boxes/${availableBox.id}/open`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (openBoxResponse.status !== 200) {
            const errorText = await openBoxResponse.text();
            throw new Error(`Open box failed: ${openBoxResponse.status} - ${errorText}`);
        }

        const openBoxData = await openBoxResponse.json();
        console.log('✅ Box opened successfully!');
        console.log('🎉 PRIZE WON:', JSON.stringify(openBoxData.prize, null, 2));
        console.log('💰 Remaining Coupon Balance:', openBoxData.couponBalance.balance);

        console.log('\n\x1b[32m%s\x1b[0m', 'SUCCESS: Gameplay flow verified!');

    } catch (error) {
        console.error('\n❌ Verification Failed:', error.message);
        if (error.message.includes('balance')) {
            console.log('💡 Hint: The user might have run out of coupons.');
        }
    }
}

runGameplayVerification();
