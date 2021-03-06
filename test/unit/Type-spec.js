define([
    'src/Type'
], function(Type) {

    const $type    = Symbol.for('cell-type');
    const $attrs   = Symbol.for('cell-type.attrs');
    const $statics = Symbol.for('cell-type.statics');
    const $inner   = Symbol.for('cell-type.inner'); // reference to the wrapped inner function

    describe("Type", function() {
        describe("Basic usage", function() {

            it("should demonstrate the basic functions of cell-multiset", function() {
                const Beginner = Type({properties: {
                    init(skill)
                    {
                        this._x = 0;

                        this.skills = ['html'];
                        if(skill) {this.skills.push(skill)}

                        return this
                    },
                    stringify()
                    {
                        return 'beginner'
                    },
                    get x()
                    {
                        return this._x - 1
                    },
                    set x(val)
                    {
                        return this._x = val + 2
                    },
                    staticMethod() {
                    "<$attrs static>";  // attributes can be used to supply additional functionality
                    {
                        return 'iamstatic'
                    }}
                }});

                const Specialist = Type({links: Beginner, properties: {
                    init(skill)
                    {
                        this._upper(skill);
                        this.skills.push('css');

                        return this
                    }
                }});
                // using the new keyword is also possible
                const Expert = new Type({name: 'Expert', links: Specialist, properties: { // an additional name can be supplied for debugging purposes
                    init(skill)
                    {
                        this._x = 7;

                        this._upper(skill);
                        this.skills.push('js');

                        return this
                    },
                    stringify()
                    {
                        return 'expert'
                    },
                    get x()
                    {
                        return this._upper() - 3
                    },
                    set x(val)
                    {
                        this._x = this._upper(val) + 4
                    },
                    staticMethod() {
                    "<$attrs static enumerable !configurable>";  // attributes can be used to supply additional functionality
                    {
                        return this._upper()
                    }},
                    staticProp: {[$attrs]: 'static', value: 10}
                }});

                const e1 = Object.create(Expert).init('xhtml');

                // default inheritance features
                expect(e1.skills).to.eql(["html", "xhtml", "css", "js"]);
                expect(Beginner.isPrototypeOf(e1)).to.be.true;
                expect(Specialist.isPrototypeOf(e1)).to.be.true;
                expect(Expert.isPrototypeOf(e1)).to.be.true;

                // inheritance for getters/setters
                e1.x = 4;
                expect(e1._x).to.deep.equal(10);
                expect(e1.x).to.deep.equal(6);

                // inheritance of static methods
                expect(Expert.staticMethod()).to.eql('iamstatic');

                // wrapping of static properties
                e2 = Object.create(Expert);
                e1.staticProp = 20;
                expect(e1.staticProp).to.eql(20);
                expect(e2.staticProp).to.eql(20);

                // using attributes to supply additional functionality
                expect(Object.getOwnPropertyDescriptor(Expert, 'init').enumerable).to.be.false; // by default enumerable is set to false
                expect(Object.getOwnPropertyDescriptor(Expert, 'init').configurable).to.be.true; // by default configurable is set to true
                expect(Object.getOwnPropertyDescriptor(Expert, 'staticMethod').enumerable).to.be.true; // using attributes this can be changed
                expect(Object.getOwnPropertyDescriptor(Expert, 'staticMethod').configurable).to.be.false; // using attributes this can be changed

                // validations
                expect(console.warn.calledWith("[Expert]: No overriding attribute and not calling upper in overriding (value) property 'stringify'.")).to.be.true;
            });
        });

        describe("inheritance principles", function() {
            it("should be able to use simple inheritance i.e. super/upper and proper context", function() {
                const B = Type({name: 'Beginner', properties: {
                    init(skill)
                    {
                        this.skills = ['html'];
                        if(skill) {this.skills.push(skill)}
    
                        return this
                    }
                }});
    
                const S = Type({name: 'Specialist', links: B, properties: {
                    init(skill)
                    {
                        this._upper(skill);
                        this.skills.push('css');
    
                        return this
                    }
                }});
                // using the new keyword is also possible
                const E = new Type({name: 'Expert', links: S, properties: {
                    init(skill)
                    {
                        this._x = 7;
    
                        this._upper(skill);
                        this.skills.push('js');
    
                        return this
                    }
                }});
    
                const e = Object.create(E).init('xhtml');
    
                expect(e.skills).to.eql(["html", "xhtml", "css", "js"]);
                expect(B.isPrototypeOf(e)).to.be.true;
                expect(S.isPrototypeOf(e)).to.be.true;
                expect(E.isPrototypeOf(e)).to.be.true;
            });
    
            it("should be able be able to inherit from getter and setter functions", function() {
                const B = Type({name: 'Beginner', properties: {
                    init()
                    {
                        this._x = 0;
    
                        return this
                    },
                    get x()
                    {
                        return this._x - 1
                    },
                    set x(val)
                    {
                        return this._x = val + 2
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
                        return this._upper() - 3
                    },
                    set x(val)
                    {
                        this._x = this._upper(val) + 4
                    }
                }});
    
                const e = Object.create(E).init();
    
                e.x = 4;
                expect(e._x).to.deep.equal(10);
                expect(e.x).to.deep.equal(6);
            });
    
            it("should be able be able to inherit from static methods", function() {
                const B = Type({name: 'Beginner', properties: {
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
                expect(E[$statics].staticMethod).to.eql(E.staticMethod[$inner]);
            });
        });
    
        describe("Attributes", function() {
    
            it("should log a warning in case of an unknown attribute.", function() {
                const B = Type({name: 'Beginner', properties: {
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
                    const B = Type({name: 'Beginner', properties: {
                        prop: 100
                    }});
    
                    const dsc = Object.getOwnPropertyDescriptor(B, 'prop');
    
                    expect(dsc.enumerable).to.be.false;
                    expect(dsc.configurable).to.be.true;
                    expect(dsc.writable).to.be.true;
                });
    
                it("should set the correct values if set as attributes", function() {
                    const B = Type({name: 'Beginner', properties: {
                        prop: {[$attrs]: "enumerable !configurable !writable", value: 100}
                    }});
    
                    const dsc = Object.getOwnPropertyDescriptor(B, 'prop');
    
                    expect(dsc.enumerable).to.be.true;
                    expect(dsc.configurable).to.be.false;
                    expect(dsc.writable).to.be.false;
                });
    
                it("should set correct values for attached & solid", function() {
                    const B = Type({name: 'Beginner', properties: {
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
    
                it("should add static properties to the prototype", function() {
                    const B = Type({name: 'Beginner', properties: {
                        method() {"<$attrs static>";
                            return 10
                        },
                        prop: {[$attrs]: 'static', value: 10}
                    }});
    
                    expect(B.method()).to.eql(10);
                    expect(B.prop).to.eql(10);
                });
    
                it("should wrap static properties using getter/setters so we can change the value on the prototype from this", function() {
                    const B = Type({name: 'Beginner', properties: {
                        method() {"<$attrs static>";
                            return 10
                        },
                        prop: {[$attrs]: 'static', value: 10}
                    }});
    
                    e1      = Object.create(B);
                    b2      = Object.create(B);
                    e1.prop = 20;
    
                    expect(e1.prop).to.eql(20);
                    expect(b2.prop).to.eql(20);
                });
    
                it("should wrap static set method to a warning message in case it contains !writable, readonly or const", function() {
                    const B = Type({name: 'Beginner', properties: {
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
                const B = Type({name: 'Beginner', properties: {
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
                const B = Type({name: 'Beginner', properties: {
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
                const BA = Type({name: 'BeginnerA', properties: {
                    init(skill)
                    {
                        this.skills = ['html'];
                        if(skill) {this.skills.push(skill)}
    
                        return this
                    }
                }});
    
                const BB = Type({name: 'BeginnerB', properties: {
                    init(skill)
                    {
                        this.skills = ['sneering'];
                        if(skill) {this.skills.push(skill)}
    
                        return this
                    }
                }});
    
                const S = Type({name: 'Specialist', links: BA, properties: {
                    init(skill)
                    {
                        this._upper(skill);
                        this.skills.push('css');
    
                        return this
                    }
                }});
    
                const E = Type({name: 'Expert', links: S, properties: {
                    init(skill)
                    {
                        this._x = 7;
    
                        this._upper(skill);
                        this.skills.push('js');
    
                        return this
                    }
                }});
    
                // swap B for BB
                Object.setPrototypeOf(S, BB);
    
                const e = Object.create(E).init('xhtml');
    
                expect(e.skills).to.eql(["sneering", "xhtml", "css", "js"]);
                // TODO testcase for traits that should break methods using upper unless some kind of adopt method is implemented
            });
    
            it("should be possible to swap functions with breaking super/upper functionality", function() {
                const B = Type({name: 'BeginnerA', properties: {
                    init(skill)
                    {
                        this.skills = ['html'];
                        if(skill) {this.skills.push(skill)}
    
                        return this
                    }
                }});
    
                const S = Type({name: 'Specialist', links: B, properties: {
                    init(skill)
                    {
                        this._upper(skill);
                        this.skills.push('css');
    
                        return this
                    }
                }});
    
                const E = Type({name: 'Expert', links: S, properties: {
                    init(skill)
                    {
                        this._x = 7;
    
                        this._upper(skill);
                        this.skills.push('js');
    
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
    
                const e = Object.create(E).init('xhtml');
    
                expect(e.skills).to.eql(["sneering", "xhtml", "css", "js"]);
                // TODO testcase for traits that should break methods using upper unless some kind of adopt method is implemented
            });
        });
    
        describe("links/inherits", function() {
    
            it("should be able to use the alias inherits instead of links", function() {
                const B = Type({name: 'Beginner', properties: {
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
                const BA = Type({name: 'BeginnerA', properties: {
                    init(skill)
                    {
                        this.skills = ['html'];
                        if(skill) {this.skills.push(skill)}
    
                        return this
                    }
                }});
    
                const BB = Type({name: 'BeginnerB', properties: {
                    init(skill)
                    {
                        this.skills = ['sneering'];
                        if(skill) {this.skills.push(skill)}
    
                        return this
                    }
                }});
    
                const S = Type({name: 'Specialist', links: BA, properties: {
                    init(skill)
                    {
                        this._upper(skill);
                        this.skills.push('css');
    
                        return this
                    }
                }});
    
                const E = Type({name: 'Expert', links: S, properties: {
                    init(skill)
                    {
                        this._x = 7;
    
                        this._upper(skill);
                        this.skills.push('js');
    
                        return this
                    }
                }});
    
                S[$type].links(BB);
    
                const e = Object.create(E).init('xhtml');
    
                expect(e.skills).to.eql(["sneering", "xhtml", "css", "js"]);
            });
    
            it("should return the linked prototype in case no arguments are given to links/inherits", function() {
                const B = Type({name: 'Beginner', properties: {
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
                    const B = Type({name: 'Beginner', properties: {
                        init () {
                            return illegal._private
                        }
                    }});
                }
    
                expect(BType).to.throw("[Beginner]: Illegal use of private property 'illegal._private' in (value) method 'init'.");
            });
    
            it("should give a warning in case of overrides without an override attribute or without using upper", function() {
    
                const B = Type({name: 'Beginner', properties: {
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
    
            it("should throw an error in case of illegal use of non-static methods", function() {
                function BType() {
                    const B = Type({name: 'Beginner', properties: {
                        nonStatic1 () {
                            return this
                        },
                        nonStatic2 () {
                            return this
                        },
                        illegalNonStaticMethodCall()
                        {   "<$attrs static>";
    
                            this.staticMethod(); // is fine
    
                            return this.nonStatic1() + this.nonStatic2(); // should throw an error
                        },
                        staticMethod()
                        {   "<$attrs static>";
    
                            return 'stuff'
                        }
                    }});
                }
    
                expect(BType).to.throw("[Beginner]: Illegal usage of non-static methods 'this.nonStatic1,this.nonStatic2' in static method 'illegalNonStaticMethodCall'.");
            });
    
            it("should output Type instead of the name in case none is given", function() {
                function BType() {
                    const B = Type({properties: {
                        nonStatic1 () {
                            return this
                        },
                        nonStatic2 () {
                            return this
                        },
                        illegalNonStaticMethodCall()
                        {   "<$attrs static>";
    
                            this.staticMethod(); // is fine
    
                            return this.nonStatic1() + this.nonStatic2(); // should throw an error
                        },
                        staticMethod()
                        {   "<$attrs static>";
    
                            return 'stuff'
                        }
                    }});
                }
    
                expect(BType).to.throw("[Type]: Illegal usage of non-static methods 'this.nonStatic1,this.nonStatic2' in static method 'illegalNonStaticMethodCall'.");
            });
        });
    
        describe("Statics", function() {
    
            it("should implement static properties is using the statics property without using a static attribute", function() {
    
                const B = Type({name: 'Beginner', statics: {
                    staticMethod() {
                        return 'staticMethod'
                    },
                    staticProperty: 42
                }});
    
                expect(B[$statics].staticProperty).to.eql(42);
                expect(B[$statics].staticMethod).to.eql(B.staticMethod);
            });
    
            it("should be able to add static methods later on using the statics method", function() {
    
                const B = Type({name: 'Beginner'});
    
                B[$type].statics({
                    staticMethod() {
                        return 'staticMethod'
                    },
                    staticProperty: 42
                });
    
                expect(B[$statics].staticProperty).to.eql(42);
                expect(B[$statics].staticMethod).to.eql(B.staticMethod);
            });
    
            it("should pass the statics properties in case the statics method is given no arguments", function() {
    
                const B = Type({name: 'Beginner'});
    
                let statics = B[$type].statics();
    
                expect(B[$statics]).to.eql(statics);
            });
        });
    
        describe("simple symbol test", function() {
            var $init  = Symbol('init');
            var $prop  = Symbol('prop');
            var $$prop = Symbol('$prop');
    
            it("should be able use symbols as keys and use attributes such as static", function() {
                const B = Type({name: 'Beginner', properties: {
                    [$init](skill)
                    {
                        this.skills = ['html'];
                        if(skill) {this.skills.push(skill)}
    
                        return this
                    },
                    [$prop]: 42,
                    [$$prop]: {[$attrs]: 'static', value: 43}
                }});
    
                const b = Object.create(B)[$init]('xhtml');
    
                expect(b.skills).to.eql(["html", "xhtml"]);
                expect(b[$prop]).to.eql(42);
                expect(b[$$prop]).to.eql(43);
                b[$$prop] = 44;
                expect(b[$$prop]).to.eql(44);
                expect(b[$statics][$$prop]).to.eql(44);
            });
        });
    
        describe("inheritance principles with symbols", function() {
            var $init = Symbol('init');
    
            it("should be able to use simple inheritance i.e. super/upper and proper context", function() {
                const B = Type({name: 'Beginner', properties: {
                    [$init](skill)
                    {
                        this.skills = ['html'];
                        if(skill) {this.skills.push(skill)}
    
                        return this
                    }
                }});
    
                const S = Type({name: 'Specialist', links: B, properties: {
                    [$init](skill)
                    {
                        this._upper(skill);
                        this.skills.push('css');
    
                        return this
                    }
                }});
    
                const E = Type({name: 'Expert', links: S, properties: {
                    [$init](skill)
                    {
                        this._x = 7;
    
                        this._upper(skill);
                        this.skills.push('js');
    
                        return this
                    }
                }});
    
                const e = Object.create(E)[$init]('xhtml');
    
                expect(e.skills).to.eql(["html", "xhtml", "css", "js"]);
                expect(B.isPrototypeOf(e)).to.be.true;
                expect(S.isPrototypeOf(e)).to.be.true;
                expect(E.isPrototypeOf(e)).to.be.true;
            });
        });
    });
});
