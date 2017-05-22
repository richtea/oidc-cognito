
const supertest = require('supertest');
const app = require('../app');
const api = supertest(app);

const test = require('tape');

test('GET /', t => {
    api
        .get('/')
        .expect('Content-type', /text\/html/)
        .expect(200)
        .end((err, res) => {
            if (err) {
                t.fail(err);
                t.end();
            } else {
                t.ok(res.body, 'It should have a response body');
                t.end();
            }
        });
});

// Ensure we get the proper 404 when trying to GET an unknown route
test('GET unknown route', t => {
    api
        .get(`/${Math.random() * 10}`)
        .expect(404)
        .end((err, _res) => {
            if (err) {
                t.fail(err);
                t.end();
            } else {
                t.pass();
                t.end();
            }
        });
});