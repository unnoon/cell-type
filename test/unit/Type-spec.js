define([
    'src/Type'
], function(Type) {

    describe("inheritance principles", function() {
        it("should be able to use simple inheritance i.e. super/upper and proper context", function() {
            const B = new Type('Beginner').properties({
                init: function(skill)
                {
                    this.skills = ['farting'];
                    if(skill) {this.skills.push(skill)}

                    return this
                }
            }).out;

            // allow for omitting the new keyword
            const S = Type('Specialist').links(B).properties({
                init: function(skill)
                {
                    this._upper(skill);
                    this.skills.push('burping');

                    return this
                }
            }).out;

            const E = new Type('Expert').links(S).properties({
                init: function(skill)
                {
                    this._x = 7;

                    this._upper(skill);
                    this.skills.push('swearing');

                    return this
                }
            }).out;

            const e = Object.create(E).init('theFinger');

            expect(e.skills).to.eql(["farting", "theFinger", "burping", "swearing"]);
        });

        it("should be able be able to inherit from getter and setter functions", function() {
            const B = new Type('Beginner').properties({
                init: function()
                {
                    this._x = 666;

                    return this
                },
                get x()
                {
                    return this._x + 111
                },
                set x(val)
                {
                    return this._x = val + 222
                }
            }).out;

            // allow for omitting the new keyword
            const S = Type('Specialist').links(B).properties({
                init: function()
                {
                    return this._upper();
                },
                get x()
                {
                    return this._upper() - 333
                },
                set x(val)
                {
                    this._x = this._upper(val) + 555
                }
            }).out;


            const s = Object.create(S).init('theFinger');

            s.x = 111;
            expect(s._x).to.deep.equal(888);
            expect(s.x).to.deep.equal(666);
        });
    });

    describe("Prototype/function swapping", function() {

        it("should be possible to swap prototypes with breaking super/upper functionality", function() {
            const BA = new Type('BeginnerA').properties({
                init: function(skill)
                {
                    this.skills = ['farting'];
                    if(skill) {this.skills.push(skill)}

                    return this
                }
            }).out;

            const BB = new Type('BeginnerB').properties({
                init: function(skill)
                {
                    this.skills = ['sneering'];
                    if(skill) {this.skills.push(skill)}

                    return this
                }
            }).out;

            // allow for omitting the new keyword
            const S = Type('Specialist').links(BA).properties({
                init: function(skill)
                {
                    this._upper(skill);
                    this.skills.push('burping');

                    return this
                }
            }).out;

            const E = new Type('Expert').links(S).properties({
                init: function(skill)
                {
                    this._x = 7;

                    this._upper(skill);
                    this.skills.push('swearing');

                    return this
                }
            }).out;

            // swap B for BB
            Object.setPrototypeOf(S, BB);

            const e = Object.create(E).init('theFinger');

            expect(e.skills).to.eql(["sneering", "theFinger", "burping", "swearing"]);
            // TODO testcase for traits that should break methods using upper unless some kind of adopt method is implemented
        });

        it("should be possible to swap functions with breaking super/upper functionality", function() {
            const B = new Type('BeginnerA').properties({
                init: function(skill)
                {
                    this.skills = ['farting'];
                    if(skill) {this.skills.push(skill)}

                    return this
                }
            }).out;

            // allow for omitting the new keyword
            const S = Type('Specialist').links(B).properties({
                init: function(skill)
                {
                    this._upper(skill);
                    this.skills.push('burping');

                    return this
                }
            }).out;

            const E = new Type('Expert').links(S).properties({
                init: function(skill)
                {
                    this._x = 7;

                    this._upper(skill);
                    this.skills.push('swearing');

                    return this
                }
            }).out;

            // swap B init
            B.init = function(skill)
            {
                this.skills = ['sneering'];
                if(skill) {this.skills.push(skill)}

                return this
            };

            const e = Object.create(E).init('theFinger');

            expect(e.skills).to.eql(["sneering", "theFinger", "burping", "swearing"]);
            // TODO testcase for traits that should break methods using upper unless some kind of adopt method is implemented
        });
    });
});

