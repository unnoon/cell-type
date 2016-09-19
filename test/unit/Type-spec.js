define([
    'src/Type'
], function(Type) {

    const $type    = Symbol.for('cell-type');
    const $attrs   = Symbol.for('cell-type.attrs');
    const $statics = Symbol.for('cell-type.statics');

    describe("inheritance principles", function() {
        it("should be able to use simple inheritance i.e. super/upper and proper context", function() {
            const B = new Type({name: 'Beginner', properties: {
                init(skill)
                {
                    this.skills = ['farting'];
                    if(skill) {this.skills.push(skill)}

                    return this
                }
            }});

            // allow for omitting the new keyword
            const S = Type({name: 'Specialist', links: B, properties: {
                init(skill)
                {
                    this._upper(skill);
                    this.skills.push('burping');

                    return this
                }
            }});

            const E = new Type({name: 'Expert', links: S, properties: {
                init(skill)
                {
                    this._x = 7;

                    this._upper(skill);
                    this.skills.push('swearing');

                    return this
                }
            }});

            const e = Object.create(E).init('theFinger');

            expect(e.skills).to.eql(["farting", "theFinger", "burping", "swearing"]);
            expect(B.isPrototypeOf(e)).to.be.true;
            expect(S.isPrototypeOf(e)).to.be.true;
            expect(E.isPrototypeOf(e)).to.be.true;
        });

        it("should be able be able to inherit from getter and setter functions", function() {
            const B = new Type({name: 'Beginner', properties: {
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
            }});

            // make sure it is able to find properties higher up the prototype chain
            const S = Type({name: 'Specialist', links: B, properties: {

            }});

            const E = Type({name: 'Expert', links: S, properties: {
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
            }});

            const s = Object.create(E).init();

            s.x = 111;
            expect(s._x).to.deep.equal(888);
            expect(s.x).to.deep.equal(666);
        });

        it("should be able be able to inherit from static methods", function() {
            const B = new Type({name: 'Beginner', properties: {
                staticMethod()
                {   "<$attrs static>";

                    return 'iamstatic'
                }
            }});

            // make sure it is able to find properties higher up the prototype chain
            const S = Type({name: 'Specialist', links: B, properties: {

            }});

            const E = Type({name: 'Expert', links: S, properties: {
                staticMethod()
                {   "<$attrs static>";

                    return this._upper()
                }
            }});

            expect(E.staticMethod()).to.eql('iamstatic');
        });
    });

    describe("Attributes", function() {

        it("should log a warning in case of an unknown attribute.", function() {
            const B = new Type({name: 'Beginner', properties: {
                init() {
                "<$attrs unknown1 !unknown2 unknown3=huh>";
                {
                    return this
                }},
                prop: {[$attrs]: 'unknown4', value: 100}
            }});

            expect(console.warn.calledWith("'unknown1' is an unknown attribute and will not be processed.")).to.be.true;
            expect(console.warn.calledWith("'unknown2' is an unknown attribute and will not be processed.")).to.be.true;
            expect(console.warn.calledWith("'unknown3' is an unknown attribute and will not be processed.")).to.be.true;
            expect(console.warn.calledWith("'unknown4' is an unknown attribute and will not be processed.")).to.be.true;
        });

        describe("default descriptor properties", function() {

            it("should set the default descriptor settings: enumerable=false configurable=true writable=true", function() {
                const B = new Type({name: 'Beginner', properties: {
                    prop: 100
                }});

                const dsc = Object.getOwnPropertyDescriptor(B, 'prop');

                expect(dsc.enumerable).to.be.false;
                expect(dsc.configurable).to.be.true;
                expect(dsc.writable).to.be.true;
            });

            it("should set the correct values if set as attributes", function() {
                const B = new Type({name: 'Beginner', properties: {
                    prop: {[$attrs]: "enumerable !configurable !writable", value: 100}
                }});

                const dsc = Object.getOwnPropertyDescriptor(B, 'prop');

                expect(dsc.enumerable).to.be.true;
                expect(dsc.configurable).to.be.false;
                expect(dsc.writable).to.be.false;
            });

            it("should set correct values for attached & solid", function() {
                const B = new Type({name: 'Beginner', properties: {
                    solidProp: {[$attrs]: "solid", value: 100},
                    attachedProp: {[$attrs]: "attached", value: 200}
                }});

                const dsc1 = Object.getOwnPropertyDescriptor(B, 'solidProp');
                const dsc2 = Object.getOwnPropertyDescriptor(B, 'attachedProp');

                expect(dsc1.configurable).to.be.false;
                expect(dsc1.writable).to.be.false;
                expect(dsc2.configurable).to.be.false;
                expect(dsc2.writable).to.be.true;
            });
        });

        describe("static", function() {

            it("should add static properties to both the prototype as well as the constructor function", function() {
                const B = new Type({name: 'Beginner', properties: {
                    method() {"<$attrs static>";
                        return 10
                    },
                    prop: {[$attrs]: 'static', value: 10}
                }});

                expect(B.method()).to.eql(10);
                expect(B.prop).to.eql(10);
                expect(B.constructor.method()).to.eql(10);
                expect(B.constructor.prop).to.eql(10);
            });

            it("should wrap static properties using getter/setters so we can change the value on the prototype from this", function() {
                const B = new Type({name: 'Beginner', properties: {
                    method() {"<$attrs static>";
                        return 10
                    },
                    prop: {[$attrs]: 'static', value: 10}
                }});

                b1      = Object.create(B);
                b2      = Object.create(B);
                b1.prop = 20;

                expect(b1.prop).to.eql(20);
                expect(b2.prop).to.eql(20);
            });

            it("should wrap static set method to a warning message in case it contains !writable, readonly or const", function() {
                const B = new Type({name: 'Beginner', properties: {
                    prop1: {[$attrs]: 'static !writable', value: 10},
                    prop2: {[$attrs]: 'static readonly',  value: 10},
                    prop3: {[$attrs]: 'static const',     value: 10}
                }});

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
            const B = new Type({name: 'Beginner', properties: {
                init() {"<$attrs alias=ctor|construct>";
                    return 'alias'
                },
            }});

            let b = Object.create(B);

            expect(b.init()).to.eql('alias');
            expect(b.ctor()).to.eql('alias');
            expect(b.construct()).to.eql('alias');
        });

        it("should set frozen, sealed, extensible from attributes on the designated obj", function() {
            const B = new Type({name: 'Beginner', properties: {
                frozen:          {[$attrs]: "frozen", value: {}},
                sealed:          {[$attrs]: "sealed", value: {}},
                ['!extensible']: {[$attrs]: "!extensible", value: {}},
            }});

            expect(Object.isFrozen(B.frozen)).to.be.true;
            expect(Object.isSealed(B.sealed)).to.be.true;
            expect(Object.isExtensible(B['!extensible'])).to.be.false;
        });
    });

    describe("Prototype/function swapping", function() {

        it("should be possible to swap prototypes with breaking super/upper functionality", function() {
            const BA = new Type({name: 'BeginnerA', properties: {
                init(skill)
                {
                    this.skills = ['farting'];
                    if(skill) {this.skills.push(skill)}

                    return this
                }
            }});

            const BB = new Type({name: 'BeginnerB', properties: {
                init(skill)
                {
                    this.skills = ['sneering'];
                    if(skill) {this.skills.push(skill)}

                    return this
                }
            }});

            // allow for omitting the new keyword
            const S = Type({name: 'Specialist', links: BA, properties: {
                init(skill)
                {
                    this._upper(skill);
                    this.skills.push('burping');

                    return this
                }
            }});

            const E = new Type({name: 'Expert', links: S, properties: {
                init(skill)
                {
                    this._x = 7;

                    this._upper(skill);
                    this.skills.push('swearing');

                    return this
                }
            }});

            // swap B for BB
            Object.setPrototypeOf(S, BB);

            const e = Object.create(E).init('theFinger');

            expect(e.skills).to.eql(["sneering", "theFinger", "burping", "swearing"]);
            // TODO testcase for traits that should break methods using upper unless some kind of adopt method is implemented
        });

        it("should be possible to swap functions with breaking super/upper functionality", function() {
            const B = new Type({name: 'BeginnerA', properties: {
                init(skill)
                {
                    this.skills = ['farting'];
                    if(skill) {this.skills.push(skill)}

                    return this
                }
            }});

            // allow for omitting the new keyword
            const S = Type({name: 'Specialist', links: B, properties: {
                init(skill)
                {
                    this._upper(skill);
                    this.skills.push('burping');

                    return this
                }
            }});

            const E = new Type({name: 'Expert', links: S, properties: {
                init(skill)
                {
                    this._x = 7;

                    this._upper(skill);
                    this.skills.push('swearing');

                    return this
                }
            }});

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

    describe("links/inherits", function() {

        it("should be able to use the alias inherits instead of links", function() {
            const B = new Type({name: 'Beginner', properties: {
                staticMethod()
                {   "<$attrs static>";

                    return 'iamstatic'
                }
            }});

            // make sure it is able to find properties higher up the prototype chain
            const S = Type({name: 'Specialist', inherits: B, properties: {

            }});

            expect(S.staticMethod()).to.eql('iamstatic');
        });

        it("should be possible to swap prototypes using the links method", function() {
            const BA = new Type({name: 'BeginnerA', properties: {
                init(skill)
                {
                    this.skills = ['farting'];
                    if(skill) {this.skills.push(skill)}

                    return this
                }
            }});

            const BB = new Type({name: 'BeginnerB', properties: {
                init(skill)
                {
                    this.skills = ['sneering'];
                    if(skill) {this.skills.push(skill)}

                    return this
                }
            }});

            // allow for omitting the new keyword
            const S = Type({name: 'Specialist', links: BA, properties: {
                init(skill)
                {
                    this._upper(skill);
                    this.skills.push('burping');

                    return this
                }
            }});

            const E = new Type({name: 'Expert', links: S, properties: {
                init(skill)
                {
                    this._x = 7;

                    this._upper(skill);
                    this.skills.push('swearing');

                    return this
                }
            }});

            S[$type].links(BB);

            const e = Object.create(E).init('theFinger');

            expect(e.skills).to.eql(["sneering", "theFinger", "burping", "swearing"]);
        });

        it("should return the linked prototype in case no arguments are given to links/inherits", function() {
            const B = new Type({name: 'Beginner', properties: {
                staticMethod()
                {   "<$attrs static>";

                    return 'iamstatic'
                }
            }});

            // make sure it is able to find properties higher up the prototype chain
            const S = Type({name: 'Specialist', inherits: B, properties: {

            }});

            expect(S[$type].links()).to.eql(B);
            expect(S[$type].inherits()).to.eql(B);
        });
    });

    describe("Validations", function() {

        it("should throw an error in case of illegal private usage", function() {
            function BType() {
                const B = new Type({name: 'Beginner', properties: {
                    init () {
                        return illegal._private
                    }
                }});
            }

            expect(BType).to.throw("[Beginner]: Illegal use of private property 'illegal._private' in (value) method 'init'.");
        });

        it("should give a warning in case of overrides without an override attribute or without using upper", function() {

            const B = new Type({name: 'Beginner', properties: {
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
            }});

            const S = Type({name: 'Specialist', links: B, properties: {
                validOverwriteMethod()
                {
                    return this._upper()
                },
                validOverwriteMethod2()
                {   "<$attrs override>";
                    return 'random stuff'
                },
                validOverwriteProp: {[$attrs]: "override", value: 43},
                warnOnThisOverrideMethod() {},
                warnOnThisOverrideProperty: 43
            }});

            expect(console.warn.calledWith("[Specialist]: No overriding attribute and not calling upper in overriding (value) property 'warnOnThisOverrideMethod'.")).to.be.true;
            expect(console.warn.calledWith("[Specialist]: No overriding attribute in overriding (value) property 'warnOnThisOverrideProperty'.")).to.be.true;
        });

        it("should throw an error in case of illegal this usage in static methods", function() {
            function BType() {
                const B = new Type({name: 'Beginner', properties: {
                    staticMethod()
                    { "<$attrs static>";

                    }
                }});

                const S = Type({name: 'Specialist', links: B, properties: {
                    thisIsFine()
                    {   "<$attrs static>";
                        return this.staticMethod()
                    }
                }});

                const E = Type({name: 'Expert', links: B, properties: {
                    illegalThis()
                    {   "<$attrs static>";
                        return this
                    }
                }});
            }

            expect(BType).to.throw("[Expert]: Illegal this usage in static method 'illegalThis'.");
        });

        it("should output Type instead of the name in case none is given", function() {
            function BType() {
                const B = new Type({properties: {
                    thisIsFine()
                    { "<$attrs static>";
                        return this.illegalThis
                    },
                    illegalThis ()
                    { "<$attrs static>";
                        return this
                    }
                }});
            }

            expect(BType).to.throw("[Type]: Illegal this usage in static method 'illegalThis'.");
        });

        it("should throw an error in case of illegal use of non-static methods", function() {
            function BType() {
                const B = new Type({name: 'Beginner', properties: {
                    nonStatic1 () {
                        return this
                    },
                    nonStatic2 () {
                        return this
                    },
                    illegalNonStaticMethodCall()
                    {   "<$attrs static>";

                        this.staticMethod(); // this is fine

                        return this.nonStatic1() + this.nonStatic2(); // this should throw an error
                    },
                    staticMethod()
                    {   "<$attrs static>";

                        return 'stuff'
                    }
                }});
            }

            expect(BType).to.throw("[Beginner]: Illegal this usage in static method 'illegalNonStaticMethodCall'.\n[Beginner]: Illegal usage of non-static methods 'this.nonStatic1,this.nonStatic2' in static method 'illegalNonStaticMethodCall'.");
        });
    });

    describe("Statics", function() {

        it("should implement static properties is using the statics property without using a static attribute", function() {

            const B = new Type({name: 'Beginner', statics: {
                staticMethod() {
                    return 'staticMethod'
                },
                staticProperty: 42
            }});

            expect(B[$statics].staticProperty).to.eql(42);
            expect(B[$statics].staticMethod).to.eql(B.staticMethod);
            expect(B[$statics].staticMethod).to.eql(B.constructor.staticMethod);
        });

        it("should be able to add static methods later on using the statics method", function() {

            const B = new Type({name: 'Beginner'});

            B[$type].statics({
                staticMethod() {
                    return 'staticMethod'
                },
                staticProperty: 42
            });

            expect(B[$statics].staticProperty).to.eql(42);
            expect(B[$statics].staticMethod).to.eql(B.staticMethod);
            expect(B[$statics].staticMethod).to.eql(B.constructor.staticMethod);
        });

        it("should pass the statics properties in case the statics method is given no arguments", function() {

            const B = new Type({name: 'Beginner'});

            let statics = B[$type].statics();

            expect(B[$statics]).to.eql(statics);
        });
    });
});

