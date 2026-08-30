/* global output, http, console */
const ts = Date.now();
const email = 'test+' + ts + '@ethos.app';
const password = 'TestPassword123!';

console.log('[seed-api] signing up: ' + email);

const signupResponse = http.post('http://localhost:3568/auth/signup', {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        formFields: [
            { id: 'email', value: email },
            { id: 'password', value: password },
        ],
    }),
});

console.log('[seed-api] signup status: ' + signupResponse.status);
console.log('[seed-api] signup body: ' + signupResponse.body);
console.log('[seed-api] signup headers: ' + JSON.stringify(signupResponse.headers));

if (!signupResponse.body.includes('"status":"OK"')) {
    throw new Error('Signup failed: ' + signupResponse.body);
}

const token =
    signupResponse.headers['st-access-token'] || signupResponse.headers['St-Access-Token'];

if (!token) {
    throw new Error(
        'No st-access-token header in signup response. Headers: ' +
            JSON.stringify(signupResponse.headers)
    );
}

console.log('[seed-api] got token, creating backend user');

const userResponse = http.post('http://localhost:8080/users', {
    headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ displayName: 'Test User' }),
});

console.log('[seed-api] POST /users status: ' + userResponse.status);
console.log('[seed-api] POST /users body: ' + userResponse.body);

if (userResponse.status !== 201) {
    throw new Error('POST /users failed (' + userResponse.status + '): ' + userResponse.body);
}

console.log('[seed-api] done — ' + email);
output.TEST_EMAIL = email;
output.TEST_PASSWORD = password;
