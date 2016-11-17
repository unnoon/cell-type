define([
    'src/Type'
], function(Type) {
    const $type     = Symbol.for('cell-type');
    const $attrs    = Symbol.for('cell-type.attrs');
    const $defaults = Symbol.for('cell-type.defaults');
    const $inject   = Symbol.for('cell-type.inject');

    describe("Type", function() {
        describe("Basic usage", function() {

            it("should demonstrate the basic functions of cell-type", function() {
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
                        this.upper(skill);
                        this.skills.push('css');

                        return this
                    }
                }});
                // using the new keyword is also possible
                const Expert = new Type({name: 'Expert', links: Specialist, properties: { // an additional name can be supplied for debugging purposes
                    init(skill)
                    {
                        this._x = 7;

                        this.upper(skill);
                        this.skills.push('js');

                        return this
                    },
                    stringify()
                    {
                        return 'expert'
                    },
                    get x()
                    {
                        return this.upper() - 3
                    },
                    set x(val)
                    {
                        this._x = this.upper(val) + 4
                    },
                    staticMethod() {
                        "<$attrs static enumerable !configurable>";  // attributes can be used to supply additional functionality
                        {
                            return this.upper()
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
                        this.upper(skill);
                        this.skills.push('css');

                        return this
                    }
                }});
                // using the new keyword is also possible
                const E = new Type({name: 'Expert', links: S, properties: {
                    init(skill)
                    {
                        this._x = 7;

                        this.upper(skill);
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
                        return this.upper();
                    },
                    get x()
                    {
                        return this.upper() - 3
                    },
                    set x(val)
                    {
                        this._x = this.upper(val) + 4
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

                        return this.upper()
                    }
                }});

                expect(E.staticMethod()).to.eql('iamstatic');
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

                it("should set the default method descriptor settings: enumerable=false configurable=true writable=true", function() {
                    const B = Type({name: 'Beginner', properties: {
                        method() {}
                    }});

                    const dsc = Object.getOwnPropertyDescriptor(B, 'method');

                    expect(dsc.enumerable).to.be.false;
                    expect(dsc.configurable).to.be.true;
                    expect(dsc.writable).to.be.true;
                });

                it("should set the default static descriptor settings: enumerable=true configurable=true writable=true", function() {
                    const B = Type({name: 'Beginner', properties: {
                        $method() {}
                    }});

                    const dsc = Object.getOwnPropertyDescriptor(B, '$method');

                    expect(dsc.enumerable).to.be.true;
                    expect(dsc.configurable).to.be.true;
                    expect(dsc.writable).to.be.true;
                });

                it("should set the correct values if set as attributes", function() {
                    const B = Type({name: 'Beginner', properties: {
                        method() {"<$attrs !configurable !writable>"}
                    }});

                    const dsc = Object.getOwnPropertyDescriptor(B, 'method');

                    expect(dsc.configurable).to.be.false;
                    expect(dsc.writable).to.be.false;
                });

                it("should set correct values for attached & solid", function() {
                    const B = Type({name: 'Beginner', properties: {
                        solidProp: {[$attrs]: "solid", value: 100},
                        attachedProp: {[$attrs]: "attached", value: 200}
                    }});

                    const b = Object.create(B, B[$defaults]);

                    const dsc1 = Object.getOwnPropertyDescriptor(b, 'solidProp');
                    const dsc2 = Object.getOwnPropertyDescriptor(b, 'attachedProp');

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

                const b = Object.create(B, B[$defaults]);

                expect(Object.isFrozen(b.frozen)).to.be.true;
                expect(Object.isSealed(b.sealed)).to.be.true;
                expect(Object.isExtensible(b['!extensible'])).to.be.false;
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
                        this.upper(skill);
                        this.skills.push('css');

                        return this
                    }
                }});

                const E = Type({name: 'Expert', links: S, properties: {
                    init(skill)
                    {
                        this._x = 7;

                        this.upper(skill);
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
                        this.upper(skill);
                        this.skills.push('css');

                        return this
                    }
                }});

                const E = Type({name: 'Expert', links: S, properties: {
                    init(skill)
                    {
                        this._x = 7;

                        this.upper(skill);
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
                        this.upper(skill);
                        this.skills.push('css');

                        return this
                    }
                }});

                const E = Type({name: 'Expert', links: S, properties: {
                    init(skill)
                    {
                        this._x = 7;

                        this.upper(skill);
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
                    // warnOnThisOverrideProperty: 42,
                    $warnOnThisOverrideProperty: 42
                }});

                const S = Type({name: 'Specialist', links: B, properties: {
                    validOverwriteMethod()
                    {
                        return this.upper()
                    },
                    validOverwriteMethod2()
                    {   "<$attrs override>";
                        return 'random stuff'
                    },
                    validOverwriteProp: {[$attrs]: "override", value: 43},
                    warnOnThisOverrideMethod() {},
                    // warnOnThisOverrideProperty: 43,
                    $warnOnThisOverrideProperty: 43
                }});
                // TODO validations for state properties
                expect(console.warn.calledWith("[Specialist]: No overriding attribute and not calling upper in overriding (value) property 'warnOnThisOverrideMethod'.")).to.be.true;
                // expect(console.warn.calledWith("[Specialist]: No overriding attribute in overriding (value) property 'warnOnThisOverrideProperty'.")).to.be.true;
                expect(console.warn.calledWith("[Specialist]: No overriding attribute in overriding (value) property '$warnOnThisOverrideProperty'.")).to.be.true;
            });

            it("should output Type instead of the name in case none is given", function() {
                function BType() {
                    const B = Type({properties: {
                        init () {
                            return illegal._private
                        }
                    }});
                }

                expect(BType).to.throw("[Type]: Illegal use of private property 'illegal._private' in (value) method 'init'.");
            });

            it("should give a warning in case of an overwrite.", function() {
                var mixin = Type({properties: {
                    init() {}
                }});

                const B = Type({mixin: [mixin], properties: {
                    init() {
                    }
                }});

                expect(console.warn.calledWith("[Type]: Property (value) init is already defined and will be overwritten.")).to.be.true;
            });

            it("should ignore a validation in case validate is set to false.", function() {
                var mixin = Type({properties: {
                    ow() {}
                }});

                const B = Type({mixin: [mixin], properties: {
                    ow() { "<$attrs !validate>"
                    }
                }});

                expect(console.warn.calledWith("[Type]: Property (value) ow is already defined and will be overwritten.")).to.be.false;
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

                expect(B.hasOwnProperty('staticProperty')).to.be.true;
                expect(B.staticProperty).to.eql(42);
                expect(B.hasOwnProperty('staticMethod')).to.be.true;
                expect(B.staticMethod()).to.eql('staticMethod');
            });

            it("should be able to add static methods later on using the statics method", function() {

                const B = Type({name: 'Beginner'});

                B[$type].statics({
                    staticMethod() {
                        return 'staticMethod'
                    },
                    staticProperty: 42
                });

                expect(B.hasOwnProperty('staticProperty')).to.be.true;
                expect(B.staticProperty).to.eql(42);
                expect(B.hasOwnProperty('staticMethod')).to.be.true;
                expect(B.staticMethod()).to.eql('staticMethod');
            });

            xit("should pass the statics properties in case the statics method is given no arguments", function() {

                const B = Type({name: 'Beginner'});

                let statics = B[$type].statics();

                expect(B[$type].static).to.eql(statics);
            });
        });

        describe("simple symbol test", function() {

            it("should be able use symbols as keys and use attributes such as static", function() {
                const $init  = Symbol('init');
                const $prop  = Symbol('prop');
                const $$prop = Symbol('$prop');

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

                const b = Object.create(B, B[$defaults])[$init]('xhtml');

                expect(b.skills).to.eql(["html", "xhtml"]);
                expect(b[$prop]).to.eql(42);
                expect(b[$$prop]).to.eql(43);
                B[$$prop] = 44;
                expect(B[$$prop]).to.eql(44);
                // expect(B[$type].static[$$prop]).to.eql(44);
            });
        });

        describe("inheritance principles with symbols", function() {
            var $init = Symbol('init2');

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
                        this.upper(skill);
                        this.skills.push('css');

                        return this
                    }
                }});

                const E = Type({name: 'Expert', links: S, properties: {
                    [$init](skill)
                    {
                        this._x = 7;

                        this.upper(skill);
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

        describe("composition", function() {

            it("should be able to compose types using other types", function() {
                const Beginner = Type({properties: {
                    html()
                    {
                        return 'html'
                    }
                }});

                const Specialist = Type({properties: {
                    css()
                    {
                        return 'css'
                    }
                }});

                const Expert = Type({properties: {
                    js()
                    {
                        return 'js'
                    }
                }});

                ComposedExpert =  Type({compose: [Beginner, Specialist, Expert], properties: {
                    skills()
                    {
                        return [this.html(), this.css(), this.js()]
                    }
                }});

                const ce = Object.create(ComposedExpert);

                expect(ce.skills()).to.eql(['html', 'css', 'js']);
            });
        });

        describe("state", function() {

            it("should be able to define a state using the state method", function() {
                const Beginner = Type({
                    state: {
                        x: 6,
                        y: 8
                    },
                });

                const b = Object.create(Beginner, Beginner[$defaults]);

                expect(b.x).to.eql(6);
                expect(b.hasOwnProperty('x')).to.be.true;
                expect(b.y).to.eql(8);
                expect(b.hasOwnProperty('y')).to.be.true;
            });

            it("should interpret properties as state properties by default", function() {
                const Beginner = Type({
                    properties: {
                        x: 6,
                        y: 8
                    },
                });

                const b = Object.create(Beginner, Beginner[$defaults]);

                expect(b.x).to.eql(6);
                expect(b.hasOwnProperty('x')).to.be.true;
                expect(b.y).to.eql(8);
                expect(b.hasOwnProperty('y')).to.be.true;
            });

            it("should be able to inherit state from higher up types", function() {
                const Beginner = Type({
                    state: {
                        x: 6
                    },
                });

                const Specialist = Type({links: Beginner,
                    state: {
                        y: 8
                    },
                });

                const s = Object.create(Specialist, Specialist[$defaults]);

                expect(s.x).to.eql(6);
                expect(s.hasOwnProperty('x')).to.be.true;
                expect(s.y).to.eql(8);
                expect(s.hasOwnProperty('y')).to.be.true;
            });

            xit("should be able to insert dependencies using state properties", function() {
                // TODO
                const Beginner = Type({
                    state: {
                        pos: {[$inject]: 'IPos', state: {x: 6, y: 8}}
                    },
                });

                const b = Object.create(Beginner, Beginner[$defaults]);

                expect(b.x).to.eql(6);
                expect(b.hasOwnProperty('x')).to.be.true;
                expect(b.y).to.eql(8);
                expect(b.hasOwnProperty('y')).to.be.true;
            });
        });

        describe("interfaces", function() {

            it("it should warn on unimplemented properties from an interface", function() {

                function itest() {
                    const IControl = Type({
                        properties: {
                            left:  () => {},
                            right: () => {},
                        },
                    });

                    const Beginner = Type({
                        implements: [IControl],
                        properties: {
                            up:   () => {},
                            down: () => {},
                        },
                    });
                }

                expect(itest).to.throw('[Type]: is not implementing property left of interface.');
            });
        });
    });
});
