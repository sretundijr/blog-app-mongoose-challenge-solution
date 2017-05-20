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
        created: Date.now()
    }
}

function createPostWithNoTitle() {
    return {
        author: {
            firstName: "steve",
            lastName: "Hello"
        },
        content: `${faker.lorem.paragraph()}`,
        created: Date.now()
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

        it('should return the correct field', function () {
            let responseBlogPost;
            return chai.request(app)
                .get('/posts')
                .then(function (res) {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.should.be.a('array');
                    res.body.should.have.length.of.at.least(1);

                    res.body.forEach(function (post) {
                        post.should.be.a('object');
                        post.should.include.keys(
                            'author', 'title', 'content', 'created', 'id'
                        )
                    })
                    responseBlogPost = res.body[0];
                    return BlogPost.findById(responseBlogPost.id)
                })
                .then(function (post) {
                    responseBlogPost.id.should.equal(post.id);
                    //ugly
                    let formattedAuthor = `${post.author.firstName} ${post.author.lastName}`.trim();
                    responseBlogPost.author.should.equal(formattedAuthor);
                    responseBlogPost.content.should.equal(post.content);
                })
        })
    })

    describe('testing post endpoint', function () {

        it('should post a new blog post', function () {
            let newPost = createFakeBlogPost();
            return chai.request(app)
                .post('/posts')
                .send(newPost)
                .then(function (res) {
                    res.should.have.status(201);
                    res.body.content.should.equal(newPost.content);
                    return BlogPost.findById(res.body.id)
                })
                .then(function (post) {
                    post.title.should.equal(newPost.title);
                })
        })

        // could we talk about this one
        // it('should test required content by not allowing a new post', function () {
        //     let badPost = createPostWithNoTitle();
        //     return chai.request(app)
        //         .post('/posts')
        //         .send(badPost)
        //     // .then(function (res) {
        //     // res.should.throw(Error)
        //     // res.should.not.equal.status(201);
        //     // })
        // })
    })

    describe('testing delete', function () {

        it('should delete a document', function () {
            let deletedPost;
            return chai.request(app)
                .get('/posts')
                .then(function (res) {
                    deletedPost = res.body[0];
                    return deletedPost;
                })
                .then(function (post) {
                    return chai.request(app)
                        .delete(`/posts/${post.id}`)
                })
                .then(function (res) {
                    res.should.have.status(204);
                    return BlogPost.findById(deletedPost.id).exec()
                })
                .then(function (_post) {
                    should.not.exist(_post)
                })
        })
    })
})

