define([
    'src/Type'
], function(Type) {

    const $attrs   = Symbol.for('cell-type.attrs');
    const $statics = Symbol.for('cell-type.statics');

    describe("inheritance principles", function() {
        it("should be able to use simple inheritance i.e. super/upper and proper context", function() {
            const B = new Type('Beginner').properties({
                init(skill)
                {
                    this.skills = ['farting'];
                    if(skill) {this.skills.push(skill)}

                    return this
                }
            }).out;

            // allow for omitting the new keyword
            const S = Type('Specialist').links(B).properties({
                init(skill)
                {
                    this._upper(skill);
                    this.skills.push('burping');

                    return this
                }
            }).out;

            const E = new Type('Expert').links(S).properties({
                init(skill)
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
                init()
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

            // make sure it is able to find properties higher up the prototype chain
            const S = Type('Specialist').links(B).properties({

            }).out;

            const E = Type('Expert').links(S).properties({
                init()
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

            const s = Object.create(E).init();

            s.x = 111;
            expect(s._x).to.deep.equal(888);
            expect(s.x).to.deep.equal(666);
        });

        it("should be able be able to inherit from static methods", function() {
            const B = new Type('Beginner').properties({
                staticMethod()
                {   "$attrs: static";

                    return 'iamstatic'
                }
            }).out;

            // make sure it is able to find properties higher up the prototype chain
            const S = Type('Specialist').links(B).properties({

            }).out;

            const E = Type('Expert').links(S).properties({
                staticMethod()
                {   "$attrs: static";

                    return this._upper()
                }
            }).out;

            expect(E.staticMethod()).to.eql('iamstatic');
        });
    });

    describe("Error on calling init when forgetting out", function() {
        it("should output an error log in case one forgets to call out", function() {

            function forgettingOut()
            {
                const B = new Type('Beginner').properties({
                    init(skill)
                    {
                        this.skills = ['farting'];
                        if(skill) {this.skills.push(skill)}

                        return this
                    }
                });

                let b = Object.create(B).init();
            }

            expect(forgettingOut).to.throw("Init not called from Type ctor. Call 'out' when creating a new Type to return the wrapped instance.");
        });
    });

    describe("Attributes", function() {

        it("should log a warning in case of an unknown attribute.", function() {
            const B = new Type('Beginner').properties({
                init() {
                "@attrs: unknown1 !unknown2 unknown3=huh";
                {
                    return this
                }},
                prop: {[$attrs]: 'unknown4', value: 100}
            }).out;

            expect(console.warn.calledWith("'unknown1' is an unknown attribute and will not be processed.")).to.be.true;
            expect(console.warn.calledWith("'unknown2' is an unknown attribute and will not be processed.")).to.be.true;
            expect(console.warn.calledWith("'unknown3' is an unknown attribute and will not be processed.")).to.be.true;
            expect(console.warn.calledWith("'unknown4' is an unknown attribute and will not be processed.")).to.be.true;
        });

        describe("default descriptor properties", function() {

            it("should set the default descriptor settings: enumerable=false configurable=true writable=true", function() {
                const B = new Type('Beginner').properties({
                    prop: 100
                }).out;

                const dsc = Object.getOwnPropertyDescriptor(B, 'prop');

                expect(dsc.enumerable).to.be.false;
                expect(dsc.configurable).to.be.true;
                expect(dsc.writable).to.be.true;
            });

            it("should set the correct values if set as attributes", function() {
                const B = new Type('Beginner').properties({
                    prop: {[$attrs]: "enumerable !configurable !writable", value: 100}
                }).out;

                const dsc = Object.getOwnPropertyDescriptor(B, 'prop');

                expect(dsc.enumerable).to.be.true;
                expect(dsc.configurable).to.be.false;
                expect(dsc.writable).to.be.false;
            });
        });

        describe("static", function() {

            it("should add static properties to both the prototype as well as the constructor function", function() {
                const B = new Type('Beginner').properties({
                    method() {"@attrs: static";
                        return 10
                    },
                    prop: {[$attrs]: 'static', value: 10}
                }).out;

                expect(B.method()).to.eql(10);
                expect(B.prop).to.eql(10);
                expect(B.constructor.method()).to.eql(10);
                expect(B.constructor.prop).to.eql(10);
            });

            it("should wrap static properties using getter/setters so we can change the value on the prototype from this", function() {
                const B = new Type('Beginner').properties({
                    method() {"@attrs: static";
                        return 10
                    },
                    prop: {[$attrs]: 'static', value: 10}
                }).out;

                b1      = Object.create(B);
                b2      = Object.create(B);
                b1.prop = 20;

                expect(b1.prop).to.eql(20);
                expect(b2.prop).to.eql(20);
            });

            it("should wrap static set method to a warning message in case it contains !writable, readonly or const", function() {
                const B = new Type('Beginner').properties({
                    prop1: {[$attrs]: 'static !writable', value: 10},
                    prop2: {[$attrs]: 'static readonly',  value: 10},
                    prop3: {[$attrs]: 'static const',     value: 10}
                }).out;

                let b = Object.create(B);

                b.prop1 = 1;
                b.prop2 = 2;
                b.prop3 = 3;

                expect(console.warn.calledWith("Trying to set value '1' on readonly (static) property 'prop1'.")).to.be.true;
                expect(console.warn.calledWith("Trying to set value '2' on readonly (static) property 'prop2'.")).to.be.true;
                expect(console.warn.calledWith("Trying to set value '3' on readonly (static) property 'prop3'.")).to.be.true;
            });
        });

        it("should define aliases if the alias attribute is provided", function() {
            const B = new Type('Beginner').properties({
                init() {"@attrs: alias=ctor|construct";
                    return 'alias'
                },
            }).out;

            let b = Object.create(B);

            expect(b.init()).to.eql('alias');
            expect(b.ctor()).to.eql('alias');
            expect(b.construct()).to.eql('alias');
        });

        it("should set frozen, sealed, extensible from attributes on the designated obj", function() {
            const B = new Type('Beginner').properties({
                frozen:          {[$attrs]: "frozen", value: {}},
                sealed:          {[$attrs]: "sealed", value: {}},
                ['!extensible']: {[$attrs]: "!extensible", value: {}},
            }).out;

            expect(Object.isFrozen(B.frozen)).to.be.true;
            expect(Object.isSealed(B.sealed)).to.be.true;
            expect(Object.isExtensible(B['!extensible'])).to.be.false;
        });
    });

    describe("Prototype/function swapping", function() {

        it("should be possible to swap prototypes with breaking super/upper functionality", function() {
            const BA = new Type('BeginnerA').properties({
                init(skill)
                {
                    this.skills = ['farting'];
                    if(skill) {this.skills.push(skill)}

                    return this
                }
            }).out;

            const BB = new Type('BeginnerB').properties({
                init(skill)
                {
                    this.skills = ['sneering'];
                    if(skill) {this.skills.push(skill)}

                    return this
                }
            }).out;

            // allow for omitting the new keyword
            const S = Type('Specialist').links(BA).properties({
                init(skill)
                {
                    this._upper(skill);
                    this.skills.push('burping');

                    return this
                }
            }).out;

            const E = new Type('Expert').links(S).properties({
                init(skill)
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
                init(skill)
                {
                    this.skills = ['farting'];
                    if(skill) {this.skills.push(skill)}

                    return this
                }
            }).out;

            // allow for omitting the new keyword
            const S = Type('Specialist').links(B).properties({
                init(skill)
                {
                    this._upper(skill);
                    this.skills.push('burping');

                    return this
                }
            }).out;

            const E = new Type('Expert').links(S).properties({
                init(skill)
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

    describe("Validations", function() {

        it("should throw an error in case of illegal private usage", function() {
            function BType() {
                const B = new Type('Beginner').properties({
                    init () {
                        return illegal._private
                    }
                }).out;
            }

            expect(BType).to.throw("[Type Beginner]: Illegal use of private property 'illegal._private' in (value) method 'init'.");
        });

        it("should give a warning in case of overrides without an override attribute or without using upper", function() {

            const B = new Type('Beginner').properties({
                validOverwriteMethod() {
                    return 'something'
                },
                validOverwriteMethod2() {
                    return 'something'
                },
                validOverwriteProp: 42,
                warnOnThisOverrideMethod()
                {

                },
                warnOnThisOverrideProperty: 42
            }).out;

            const S = Type('Specialist').links(B).properties({
                validOverwriteMethod()
                {
                    return this._upper()
                },
                validOverwriteMethod2()
                {   "@attrs: override";
                    return 'random stuff'
                },
                validOverwriteProp: {[$attrs]: "override", value: 43},
                warnOnThisOverrideMethod() {},
                warnOnThisOverrideProperty: 43
            }).out;

            expect(console.warn.calledWith("[Type Specialist]: No overriding attribute and not calling upper in overriding (value) property 'warnOnThisOverrideMethod'.")).to.be.true;
            expect(console.warn.calledWith("[Type Specialist]: No overriding attribute in overriding (value) property 'warnOnThisOverrideProperty'.")).to.be.true;
        });

        it("should throw an error in case of illegal this usage in static methods", function() {
            function BType() {
                const B = new Type('Beginner').properties({
                    thisIsFine()
                    {
                        return this.illegalThis
                    },
                    illegalThis () { "@attrs: static";
                        return this
                    }
                }).out;
            }

            expect(BType).to.throw("[Type Beginner]: Illegal this usage in static method 'illegalThis'.");
        });

        it("should throw an error in case of illegal use of non-static methods", function() {
            function BType() {
                const B = new Type('Beginner').properties({
                    nonStatic1 () {
                        return this
                    },
                    nonStatic2 () {
                        return this
                    },
                    staticMethod()
                    {   "@attrs: static";

                        return 'stuff'
                    },
                    illegalNonStaticMethodCall()
                    {   "@attrs: static";

                        this.staticMethod(); // this is fine

                        return this.nonStatic1() + this.nonStatic2(); // this should throw an error
                    }
                }).out;
            }

            expect(BType).to.throw("[Type Beginner]: Illegal this usage in static method 'illegalNonStaticMethodCall'.\n[Type Beginner]: Illegal usage of non-static methods 'this.nonStatic1,this.nonStatic2' in static method 'illegalNonStaticMethodCall'.");
        });
    });

    describe("Statics method", function() {

        it("should implement static properties is using the statics method without using a static attribute", function() {

            const B = new Type('Beginner').statics({
                staticMethod() {
                    return 'staticMethod'
                },
                staticProperty: 42
            }).out;

            expect(B[$statics].staticProperty).to.eql(42);
            expect(B[$statics].staticMethod).to.eql(B.staticMethod);
            expect(B[$statics].staticMethod).to.eql(B.constructor.staticMethod);
        });
    });
});

