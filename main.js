const admin = require("firebase-admin");

let app, auth, apiKey = null

module.exports.templateTags = [{
    name: 'firebase',
    displayName: 'Firebase uid / token',
    description: 'firebase uid and id token generator',
    args: [
        {
            displayName: 'type',
            type: 'enum',
            options: [
                { displayName: 'uid', value: 'uid' },
                { displayName: 'token', value: 'token' }
            ]
        },
        {
            displayName: 'Email',
            type: 'string',
            defaultValue: '',
        }
    ],
    async run({ context, meta }, type, email) {
        if (!app && context.firebase) {
            app = admin.initializeApp({
                credential: admin.credential.cert(context.firebase.config)
            }, meta.requestId)
            apiKey = context.firebase.apiKey
        }
        if (app && email) {
            auth = app.auth()
            if (type === 'uid') return await getUid(email)
            if (type === 'token') return await generateToken(email)
        } else {
            return 'waiting for values...'
        }
    },
}]

async function getUid(email) {
    auth = app.auth()
    user = await auth.getUserByEmail(email)
    return user.uid
}

async function generateToken(email) {
    auth = app.auth()

    user = await auth.getUserByEmail(email)
    customToken = await auth.createCustomToken(user.uid)
    const data = await convertToken(customToken)
    return data.idToken;
}

async function convertToken(customToken) {
    try {
        const res = await fetch(`https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyCustomToken?key=` + apiKey, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token: customToken,
                returnSecureToken: true
            }),
        })

        const data = await res.json()
        return data;
    } catch (error) {
        return error
    }
}