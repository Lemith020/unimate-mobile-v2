const jwt = require('jsonwebtoken');

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function authMiddleware(req, res, next) {
    const secret = process.env.JWT_SECRET;

    if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
        console.error('A valid JWT_SECRET is required.');

        return res.status(500).json({
            error: 'Authentication is not configured.',
        });
    }

    const authorization = req.get('Authorization') || '';
    const match = authorization.match(/^Bearer\s+(\S+)$/i);

    if (!match) {
        return res.status(401).json({
            error: 'Please log in to place an order.',
        });
    }

    try {
        const payload = jwt.verify(match[1], secret, {
            algorithms: ['HS256'],
            issuer: 'unimate-api',
            audience: 'unimate-mobile',
        });

        if (
            typeof payload !== 'object' ||
            typeof payload.sub !== 'string' ||
            !UUID_PATTERN.test(payload.sub) ||
            typeof payload.exp !== 'number'
        ) {
            return res.status(401).json({
                error: 'Invalid login session. Please log in again.',
            });
        }

        req.user = {
            id: payload.sub,
        };
    } catch (error) {
        return res.status(401).json({
            error:
                error.name === 'TokenExpiredError'
                    ? 'Your session has expired. Please log in again.'
                    : 'Invalid login session. Please log in again.',
        });
    }

    return next();
}

module.exports = authMiddleware;