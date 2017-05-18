const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const should = chai.should();

const { BlogPost } = require('../models');
const { runServer, app, closeServer } = require('../server');

const { TEST_DATABASE_URL } = require('../config');

chai.use(chaiHttp);

function createFakeBlogPost() {
    return {
        author: {
            firstName: `${faker.name.firstName()}`,
            lastName: `${faker.name.lastName()}`
        },
        title: `${faker.lorem.sentence()}`,
        content: `${faker.lorem.paragraph()}`,
        date: Date.now()
    }
}

function seedDatabase() {
    const seedData = [];

    for (var i = 0; i < 5; i++) {
        seedData.push(createFakeBlogPost());
    }

    return BlogPost.insertMany(seedData);
}

function tearDownDb() {
    console.warn('Deleting database');
    return mongoose.connection.dropDatabase();
}

describe('Blog post api', function () {
    before(function () {
        return runServer(TEST_DATABASE_URL);
    });

    beforeEach(function () {
        return seedDatabase();
    });

    afterEach(function () {
        return tearDownDb();
    });

    after(function () {
        return closeServer();
    });

    describe('get endpoint testing', function () {

        it('should return all blog posts', function () {
            let res;
            return chai.request(app)
                .get('/posts')
                .then(function (_res) {
                    res = _res;
                    res.should.have.status(200);

                    res.body.should.have.length.of.at.least(1);
                    return BlogPost.count();
                })
                .then(function (count) {
                    res.body.should.have.length.of(count);
                })
        })
    })
})

