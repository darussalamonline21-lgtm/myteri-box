const LOGIN_URL = 'http://localhost:5000/api/v1/auth/login';
const TEST_USER = {
    storeCode: 'PEMENANG-001',
    password: 'secret123'
};

async function runVerification() {
    console.log('🚀 Starting Verification Script...\n');

    try {
        console.log(`Testing Login for user: ${TEST_USER.storeCode}`);

        const response = await fetch(LOGIN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(TEST_USER)
        });

        if (response.status !== 200) {
            const errorText = await response.text();
            console.error(`❌ Test 1 Failed: HTTP Status ${response.status}`);
            console.error(`Response: ${errorText}`);
            return;
        }

        const data = await response.json();

        console.log('Response received:', JSON.stringify(data, null, 2));

        if (data.activeCampaignId) {
            console.log(`\n✅ Test 1 Passed: User has Campaign ID: ${data.activeCampaignId}`);
            console.log('\x1b[32m%s\x1b[0m', 'SUCCESS: Active Campaign ID verification successful!'); // Green
        } else {
            console.error('\n❌ Test 1 Failed: activeCampaignId is missing or null');
            console.log('\x1b[31m%s\x1b[0m', 'FAILURE: Active Campaign ID verification failed.'); // Red
        }

    } catch (error) {
        console.error('❌ Script Error:', error.message);
        console.log('Make sure the backend server is running on port 5000.');
    }
}

runVerification();
