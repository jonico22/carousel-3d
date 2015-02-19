/* global define, require, exports */


/**
 * Carousel3d
 */
(function(factory) {
	'use strict';
	if (typeof define === 'function' && define.amd) {
		define(['jquery', 'modernizr', 'jquery.resize'], factory);
	} else if (typeof exports !== 'undefined') {
		module.exports = factory(require('jquery'), require('modernizr'), require('jquery.resize'));
	} else {
		factory($, Modernizr);
	}
}(function($) {
	'use strict';

	/**
	 * constructor
	 * @param panel
	 * @constructor
	 */
	var Carousel3d = function (panel) {
        this._panel = panel;
        this._prevButton = $(panel).find('[data-carousel-3d-prev], [data-carousel-3d-left]')[0];
        this._nextButton = $(panel).find('[data-carousel-3d-next], [data-carousel-3d-right]')[0];
        this._childrenWrapper = $(panel).find('[data-carousel-3d-children]')[0];
        if (this._childrenWrapper) {
            this._children = [];
            $(this._childrenWrapper).children().each(function (index, child) {
                this._children.push(child);
            }.bind(this));
        }

        if (Modernizr.csstransforms3d) {
            $.extend(this, renderer3DTransform);
        }
        else if (Modernizr.csstransforms) {
            $.extend(this, rendererTransform);
        }
        else {
            $.extend(this, rendererTransform);
            this._ieTransform = true;
        }

        if (windowLoaded) {
            this._init();
        } else {
            $(this._panel).css('visibility', 'hidden');
            $(window).load(function () {
                this._init();
                $(this._panel).css('visibility', 'visible');
            }.bind(this));
        }
	};


    /**
     *
     * @type {number}
     * @private
     */
    Carousel3d.prototype._aspectRatio = 1.5;


    /**
     *
     * @type {number}
     * @private
     */
    Carousel3d.prototype._spacing = 0.05;


    /**
     * Animate duration in milli-second
     * @type {number}
     * @private
     */
    Carousel3d.prototype._animateDuration = 1000;


    /**
     *
     * @type {null}
     * @private
     */
    Carousel3d.prototype._panel = null;

    /**
     *
     * @type {null}
     * @private
     */
    Carousel3d.prototype._prevButton = null;

    /**
     *
     * @type {null}
     * @private
     */
    Carousel3d.prototype._nextButton = null;

    /**
     *
     * @type {null}
     * @private
     */
    Carousel3d.prototype._childrenWrapper = null;

    /**
     *
     * @type {null}
     * @private
     */
    Carousel3d.prototype._children = null;

    /**
     *
     * @type {number}
     * @private
     */
    Carousel3d.prototype._currentIndex = 0;



	/**
	 * initializer
	 * @param panel
	 */
	Carousel3d.prototype._init = function (done) {
        var self = this;

        //init panel
        $(this._panel).css('position', 'relative');
        $(this._panel).css('overflow', 'hidden');
        $(this._panel).css('width', '99%');
        $(this._panel).css('height', '100%');

        $(this._prevButton).css('position', 'absolute');
        $(this._nextButton).css('position', 'absolute');
        $(this._prevButton).css('z-index', 1000);
        $(this._nextButton).css('z-index', 1000);
        $(this._prevButton).css('top', '50%');
        $(this._nextButton).css('top', '50%');
        $(this._prevButton).css('left', '0px');
        $(this._nextButton).css('right', '0px');

        $(this._childrenWrapper).css('position', 'absolute');
        $(this._childrenWrapper).css('perspective', '1000px');
        $(this._childrenWrapper).css('-moz-perspective', '1000px');
        $(this._childrenWrapper).css('-webkit-perspective', '1000px');
        $(this._childrenWrapper).css('list-style-type', 'none');
        $(this._childrenWrapper).css('margin', '0px');
        $(this._childrenWrapper).css('padding', '0px');
        $(this._childrenWrapper).css('width', '100%');
        $(this._childrenWrapper).css('height', '100%');

        $(this._panel).resize(this._resize.bind(this));
        //TODO safari doesn't call resize for the first time. work around. fix this later.
        $(this._panel).css('width', '100%');

        if (this._children) {
            $(this._children).each(function (index, child) {
                $(child).css('position', 'absolute');
                $(child).css('transition', (this._animateDuration / 1000) + 's');
                $(child).css('-moz-transition', (this._animateDuration / 1000) + 's');
                $(child).css('-webkit-transition', (this._animateDuration / 1000) + 's');
            }.bind(this));
        }

        $(this._prevButton).click(function () {
            this.left();
        }.bind(this));
        $(this._nextButton).click(function () {
            this.right();
        }.bind(this));

        //done();
	};


    /**
     * fires 'select' event on element
     * @param index
     */
    Carousel3d.prototype._triggerSelect = function (index) {
        window.setTimeout(function () {
            $(this._panel).trigger('select', index % this._children.length);
        }.bind(this), this._animateDuration);
    };

    /**
     * make carousel spin left
     */
    Carousel3d.prototype.left = function () {
        this._currentIndex -= 1;
        this._rotateChildren(this._currentIndex);
    };

    /**
     * make carousel spin right
     */
    Carousel3d.prototype.right = function () {
        this._currentIndex += 1;
        this._rotateChildren(this._currentIndex);
    };


    /**
     *
     * @private
     */
    Carousel3d.prototype._resize = function () {
        var wrapper = this._childrenWrapper;
        var panelWidth = $(this._panel).width();
        var panelHeight = $(this._panel).height();
        var wrapperWidth = Math.min(panelHeight * this._aspectRatio, panelWidth);
        var wrapperHeight = Math.min(wrapperWidth / this._aspectRatio, panelHeight);
        $(wrapper).width(wrapperWidth);
        $(wrapper).height(wrapperHeight);
        $(wrapper).css('left', (panelWidth - wrapperWidth) / 2);
        $(wrapper).css('top', (panelHeight - wrapperHeight) / 2);
        if (this._children) {
            $(this._children).each(function (index, child) {
                $(child).data('width', $(child).width());
                $(child).data('height', $(child).height());
                if ($(child).attr('selected')) {
                    this._currentIndex = index;
                }
            }.bind(this));
        }
        this._rotateChildren(this._currentIndex);
    };


    /**
     * Renderer for browsers supporting css transform including ie8
     * @type {{_initChildren: Function, _applyChildZIndex: Function, _rotateChild: Function}}
     */
    var rendererTransform = {
        _ieTransform: false,
        _rotateChildren: function (index) {
            var degree = -index * (360 / this._children.length);
            if (this._children) {
                $(this._children).each(function (index, child) {
                    this._rotateChild(child, index, degree);
                }.bind(this));
            }
            this._triggerSelect(index);
        },
        _rotateChild: function (child, index, degree) {
            $(child).css('overflow', 'hidden');
            var baseScale = 1;
            var width = $(child).data('width');
            var height = $(child).data('height');
            var wrapperWidth = $(this._childrenWrapper).width();
            var wrapperHeight = $(this._childrenWrapper).height();
            if ((width / height) > this._aspectRatio) {
                baseScale = wrapperWidth / width;
            } else {
                baseScale = wrapperHeight / height;
            }

            var childDegree = ((360 / this._children.length) * index) + degree;
            $(child).animate({
                '_degree': childDegree
            }, {
                duration: this._animateDuration,
                step: function (now, tween) {
                    if (tween.prop === '_degree') {
                        var sin = Math.sin(Math.PI / 180 * now);
                        var cos = Math.cos(Math.PI / 180 * now);
                        var halfDegreeRange = 360 / this._children.length / 2;
                        var perspectiveScale = Math.abs(Math.sin(Math.PI / 180 * (now + halfDegreeRange)) - Math.sin(Math.PI / 180 * (now - halfDegreeRange)))
                            / (Math.sin(Math.PI / 180 * halfDegreeRange) * 2) * cos;
                        var heightScale = baseScale * (cos + 1) / 2;
                        var widthScale = baseScale * perspectiveScale;
                        var dx = sin * wrapperWidth / 2 + (width * widthScale / 2 * sin);

                        $(tween.elem).css('z-index', Math.floor((cos + 1) * 100));
                        $(tween.elem).css('top', (wrapperHeight - height * heightScale) / 2 + 'px');
                        $(tween.elem).css('left', ((wrapperWidth - width * widthScale) / 2 + dx) + 'px');
                        if (this._ieTransform) {
                            $(tween.elem).css('filter', 'progid:DXImageTransform.Microsoft.Matrix(M11=' + widthScale + ', M12=0, M21=0, M22=' + heightScale + ', SizingMethod="auto expand"), progid:DXImageTransform.Microsoft.Alpha(Opacity=' + cos * 100 + ')');
                            $(tween.elem).css('-ms-filter', 'progid:DXImageTransform.Microsoft.Matrix(M11=' + widthScale + ', M12=0, M21=0, M22=' + heightScale + ', SizingMethod="auto expand"), progid:DXImageTransform.Microsoft.Alpha(Opacity=' + cos * 100 + ')');
                        } else {
                            $(tween.elem).css('opacity', cos);
                            $(tween.elem).css('transform-origin', '0px 0px');
                            $(tween.elem).css('-moz-transform-origin', '0px 0px');
                            $(tween.elem).css('-webkit-transform-origin', '0px 0px');
                            $(tween.elem).css('transform', 'scale(' + widthScale + ', ' + heightScale + ')');
                            $(tween.elem).css('-moz-transform', 'scale(' + widthScale + ', ' + heightScale + ')');
                            $(tween.elem).css('-webkit-transform', 'scale(' + widthScale + ', ' + heightScale + ')');
                        }
                    }
                }.bind(this)
            });
        }
    };


    /**
     * Renderer for browsers supporting css transform3d
     * @type {{_tz: number, _initChildren: Function, _applyChildZIndex: Function, _rotateChild: Function}}
     */
    var renderer3DTransform = {
        _tz: 0,
        _rotateChildren: function (index) {
            var wrapperWidth = $(this._childrenWrapper).width();
            this._tz =  (wrapperWidth / 2) / Math.tan(Math.PI / this._children.length);
            rendererTransform._rotateChildren.call(this, index);
        },
        _rotateChild: function (child, index, degree) {
            degree = degree ? degree : 0;

            //scale, margin
            var width = $(child).width();
            var height = $(child).height();
            var wrapperWidth = $(this._childrenWrapper).width();
            var wrapperHeight = $(this._childrenWrapper).height();
            var scale = (wrapperWidth) / width;
            if ((width / height) < this._aspectRatio) {
                scale = wrapperHeight / height;
            }
            var scaledWidth = width * scale;
            var scaledHeight = height * scale;

            $(child).css('left', ((scaledWidth - width) / 2) + ((wrapperWidth - scaledWidth) / 2) + 'px');
            $(child).css('top', ((scaledHeight - height) / 2) + ((wrapperHeight - scaledHeight) / 2) + 'px');

            //rotation
            $(child).data('index', index);
            $(child).data('cssScale', scale);

            var childDegree = ((360 / this._children.length) * index) + degree;
            var transformText = '';
            transformText += ' scale(' + scale + ')';
            transformText += ' translateZ(' + -this._tz * (1 / scale) * (1 + this._spacing) + 'px)';
            transformText += ' rotateY(' + childDegree + 'deg)';
            transformText += ' translateZ(' + this._tz * (1 / scale) * (1 + this._spacing) + 'px)';
            $(child).css('transform', transformText);
            $(child).css('-moz-transform', transformText);
            $(child).css('-webkit-transform', transformText);

            $(child).css('opacity', Math.cos(Math.PI / 180 * childDegree));
            $(child).css('z-index', Math.floor((Math.cos(Math.PI / 180 * childDegree) + 1) * 100));
        }
    };




	/**
	 * Exposed to jquery.
	 * @returns {*}
	 */
	$.fn.carousel3d = function() {
		var self = this, opt = arguments[0], args = Array.prototype.slice.call(arguments,1), l = self.length, i = 0, ret;
		for(i; i < l; i += 1) {
			if (typeof opt === 'object' || typeof opt === 'undefined') {
				self[i].carousel3d =  new Carousel3d(self[i], opt);
			}
			else {
				ret = self[i].carousel3d[opt].apply(self[i].carousel3d, args);
			}
			if (ret !== undefined) {
				return ret;
			}
		}
		return self;
	};



	/**
	 * initialize on load
	 */
    $(function () {
        $('[data-carousel-3d]').carousel3d();
    });
    var windowLoaded = false;
    $(window).load(function () {
        windowLoaded = true;
    });


    /**
     * Math.sign shim
     */
    if (!Math.sign) {
        Math.sign = function (value) {
            var number = +value;
            if (number === 0) { return number; }
            return number < 0 ? -1 : 1;
        }
    }

}));