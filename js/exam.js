/**
 * Class to add auto suggest capability to an input element
 */
class AutoSuggestion {
  constructor(element, options) {
    this.defaultOptions = {
      /**
       * Left offset to place the suggestion box
       */
      offsetLeft: 0,
      /**
       * Left offset to place the suggestion box
       */
      offsetTop: 0,
      /**
       * Minimum characters required to trigger the suggestion
       */
      minChars: 0,
      /**
       * The delay time to perform search suggestions
       */
      delay: 100,
      /**
       * Css class for the suggestion box
       */
      menuClass: '',
      /**
       * The data that returned from a search
       */
      dataSource: (searchTerm, callback) => {}
    };
    this.element = element; // input element to attach aut-suggestion function
    this.options = Object.assign({}, this.defaultOptions, options);
    this.cache = {};
    this.initialize();
  }
  /**
   * Initialization work
   */
  initialize() {
    // create suggestions container (wrapper)
    this.suggestionContainer = document.createElement('div');
    this.suggestionContainer.className = `autocomplete-suggestions ${this.options.menuClass}`;
    document.body.appendChild(this.suggestionContainer);
  
    // register event listeners on the input element
    Utils.addEvent(this.element, 'keydown', this.onInputKeyDown.bind(this));
    Utils.addEvent(this.element, 'keyup', this.onInputKeyup.bind(this));
    Utils.addEvent(this.element, 'blur', this.onInputBlur.bind(this));
    if (!this.options.minChars) {
      Utils.addEvent(this.element, 'focus', this.onInputFocus.bind(this));
    }
  
    // delegate suggestion item's event
    Utils.delegateEvent("autocomplete-suggestion", "mousedown", (selectedSuggestion) => {
    
    }, this.suggestionContainer);
  
    Utils.delegateEvent("autocomplete-suggestion", "mouseover", (selectedSuggestion) => {
      const currentSelectedSuggestion = this.suggestionContainer.querySelector('.autocomplete-suggestion.selected');
      if (currentSelectedSuggestion) {
        Utils.removeClass(currentSelectedSuggestion, "selected");
      }
      Utils.addClass(selectedSuggestion, "selected");
    }, this.suggestionContainer);
  
    Utils.delegateEvent("autocomplete-suggestion", "mouseleave", () => {
      const selectedSuggestion = this.suggestionContainer.querySelector('.autocomplete-suggestion.selected');
      if (selectedSuggestion) {
        setTimeout(() => {
          Utils.removeClass(selectedSuggestion, "selected");
        }, 20);
      }
    }, this.suggestionContainer);
  }
  /**
   * Handle focus event on input element
   */
  onInputFocus(e) {
    this.lastSearchTerm = '\n';
    this.onInputKeyup(e);
  }
  /**
   * Handle keydown event on input element
   */
  onInputKeyDown(e) {
    const key = e.keyCode;
    // down (40), up (38)
    if ((key === 40 || key === 38) && this.suggestionContainer.innerHTML) {
      let nextSelectedSuggestion, selectedSuggestion = this.suggestionContainer.querySelector('.autocomplete-suggestion.selected');
      if (!selectedSuggestion) {
        // if there is no currently selected item, then move to the first or last suggestion item depending on key is down or up
        nextSelectedSuggestion = (key === 40) ? this.suggestionContainer.querySelector('.autocomplete-suggestion') :
          this.suggestionContainer.childNodes[this.suggestionContainer.childNodes.length - 1];
        Utils.addClass(nextSelectedSuggestion, "selected");
        this.element.value = nextSelectedSuggestion.getAttribute('data-val');
      } else {
        // move to the next or previous sibling
        Utils.removeClass(selectedSuggestion, "selected");
        nextSelectedSuggestion = (key === 40) ? selectedSuggestion.nextSibling : selectedSuggestion.previousSibling;
        if (nextSelectedSuggestion) {
          Utils.addClass(nextSelectedSuggestion, "selected");
          this.element.value = nextSelectedSuggestion.getAttribute('data-val');
        }
        else {
          this.element.value = this.lastSearchTerm;
          nextSelectedSuggestion = 0;
        }
      }
      this.updateSuggestionContainer(0, nextSelectedSuggestion);
      return false;
    }
    // esc
    else if (key === 27) {
      this.element.value = this.lastSearchTerm;
      Utils.debounce(this.hideSuggestion.bind(this), 20)();
    }
    // enter
    else if (key === 13 || key === 9) {
      e.preventDefault();
      let selectedSuggestion = this.suggestionContainer.querySelector('.autocomplete-suggestion.selected');
      if (selectedSuggestion && this.suggestionContainer.style.display !== 'none') {
        this.onSelectSuggestion(selectedSuggestion.getAttribute('data-val'));
        Utils.debounce(this.hideSuggestion.bind(this), 20)();
      }
    }
  }
  /**
   * Handle keyup event on input element
   */
  onInputKeyup(e) {
    const key = window.event ? e.keyCode : e.which;
    if (!key || (key < 35 || key > 40) && key !== 13 && key !== 27) {
      let searchTerm = this.element.value; // get the search term
      if (searchTerm.length >= this.options.minChars) {
        if (searchTerm !== this.lastSearchTerm) {
          this.lastSearchTerm = searchTerm;
          clearTimeout(this.timer);
          if (this.options.cache) {
            if (searchTerm in this.cache) { // if the search already cached
              this.suggest(this.cache[searchTerm]);
              return;
            }
            // check if previous suggestions, if there was no
            for (let i=1; i<searchTerm.length-this.options.minChars; i++) {
              let previousSearchTerm = searchTerm.slice(0, searchTerm.length-i);
              if (previousSearchTerm in this.cache && !this.cache[previousSearchTerm].length) {
                this.suggest([]); return;
              }
            }
          }
          // if the search term is not cached, then perform new search against data-source
          this.timer = setTimeout(() => {
            this.options.dataSource(searchTerm, this.suggest.bind(this));
          }, this.options.delay);
        }
      } else {
        this.lastSearchTerm = searchTerm;
        Utils.debounce(this.hideSuggestion.bind(this), 20)();
      }
    }
  }
  /**
   * Handle blur event on input element
   */
  onInputBlur() {
    
  }
  /**
   * Responsible for building the suggestion list based on returned data from data source
   * @param {array} data - data returned from data source
   */
  suggest(data) {
    const searchTerm = this.element.value;
    if (data.length && searchTerm.length >= this.options.minChars) {
      // build the list suggestions
      let suggestionString = '';
      for (let i=0;i<data.length;i++)  {
        suggestionString += this.renderItem(data[i], searchTerm);
      }
      this.suggestionContainer.innerHTML = suggestionString;
      this.updateSuggestionContainer();
    }
    else {
      this.hideSuggestion();
    }
  }
  /**
   * Update position and layout of suggestion container
   * @param {object} item - item data to render
   * @param {string} search - search term
   */
  renderItem(item, search) {
    // This must be implemented in the inherited classes
  }
  /**
   * Update position and layout of suggestion container
   */
  updateSuggestionContainer(resize, nextSuggestionItem) {
    let rect = this.element.getBoundingClientRect();
    this.suggestionContainer.style.left = Math.round(rect.left + (window.pageXOffset || document.documentElement.scrollLeft) + this.options.offsetLeft) + 'px';
    this.suggestionContainer.style.top = Math.round(rect.bottom + (window.pageYOffset || document.documentElement.scrollTop) + this.options.offsetTop) + 'px';
    this.suggestionContainer.style.width = Math.round(rect.right - rect.left) + 'px'; // outerWidth
    if (!resize) {
      this.suggestionContainer.style.display = 'block';
      if (!this.suggestionContainer.maxHeight) { this.suggestionContainer.maxHeight = parseInt((window.getComputedStyle ? getComputedStyle(this.suggestionContainer, null) : this.suggestionContainer.currentStyle).maxHeight); }
      if (!this.suggestionContainer.suggestionHeight) this.suggestionContainer.suggestionHeight = this.suggestionContainer.querySelector('.autocomplete-suggestion').offsetHeight;
      if (this.suggestionContainer.suggestionHeight)
        if (!nextSuggestionItem) this.suggestionContainer.scrollTop = 0;
        else {
          let scrTop = this.suggestionContainer.scrollTop, selTop = nextSuggestionItem.getBoundingClientRect().top - this.suggestionContainer.getBoundingClientRect().top;
          if (selTop + this.suggestionContainer.suggestionHeight - this.suggestionContainer.maxHeight > 0)
            this.suggestionContainer.scrollTop = selTop + this.suggestionContainer.suggestionHeight + scrTop - this.suggestionContainer.maxHeight;
          else if (selTop < 0)
            this.suggestionContainer.scrollTop = selTop + scrTop;
        }
    }
  }
  /**
   * Hide suggestion box
   */
  hideSuggestion() {
    this.suggestionContainer.style.display = 'none';
  }
  /**
   * Handle when a suggestion item is selected
   */
  onSelectSuggestion(item) {
  
  }
}

class AppsSuggestion extends AutoSuggestion{
  constructor(element, options) {
    super(element, options);
  }
  
  renderItem(item, search) {
    // escape special characters
    search = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    // find all occurrences of the search term
    let re = new RegExp("(" + search.split(' ').join('|') + ")", "gi");
    return `<div class="autocomplete-suggestion" data-val="${item.name}"><img src="${item.thumbnailUrl}"/><span>${item.name.replace(re, "<b>$1</b>")}</span></div>`;
  }
  
  onSelectSuggestion(item) {
  
  }
}

class Utils {
  static removeClass(el, cssClass) {
    el.className = el.className.replace(cssClass, '');
  }
  static addClass(el, cssClass) {
    el.className += ` ${cssClass}`;
  }
  static debounce(fn, delay) {
    let timer = null;
    return function() {
      let context = this;
      let args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function(){
        fn.apply(context, args);
      }, delay);
    }
  }
  /**
   * register event listener
   * @param {DOM} el - element to listen
   * @param {string} type - event to listen
   * @param {function} handler - handler when event occurs
   */
  static addEvent(el, type, handler) {
    if (el.attachEvent) {
      el.attachEvent(`on${type}`, handler);
    } else {
      el.addEventListener(type, handler);
    }
  }
  /**
   * unregister event listener
   * @param {DOM} el - element to listen
   * @param {string} type - event to listen
   * @param {function} handler - handler when event occurs
   */
  static removeEvent(el, type, handler){
    // if (el.removeEventListener) not working in IE11
    if (el.detachEvent) {
      el.detachEvent(`on${type}`, handler);
    }
    else {
      el.removeEventListener(type, handler);
    }
  }
  /**
   * delegate event.
   * Instead of add event listener for each element having a specific css class,
   * just listen event on a wrapper element (context).
   * When event is raised, we need to resolve the target element based its css class
   * @param {string} elClass - css class to resolve element when the event raised
   * @param {string} type - event to listen
   * @param {function} cb - call back function when the event is for target element
   * @param {DOM} context - the wrapper element to listen event on
   */
  static delegateEvent(elClass, type, cb, context) {
    this.addEvent(context || document, type, function (e) {
      let found, el = e.target || e.srcElement;
      // loop to find the source element
      while (el && !(found = Utils.hasClass(el, elClass))) {
        el = el.parentElement;
      }
      if (found) cb(el, e);
    });
  }
  /**
   * Check if an element has a specific css class
   */
  static hasClass(el, className){
    return el.classList ? el.classList.contains(className) : new RegExp('\\b'+ className+'\\b').test(el.className);
  }
}

(function(){
  if (typeof define === 'function' && define.amd) {
    define('autoComplete', function () { return AutoSuggestion; });
  }
  else if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutoSuggestion;
  }
  else {
    window.AutoSuggestion = AutoSuggestion;
  }
  
  new AppsSuggestion(document.getElementById('txtApps'), {
    dataSource: (term, callback) => {
      term = term.toLowerCase();
      const choices = TABLE_DATA;
      let matches = [];
      for (let i=0; i < choices.length; i++) {
        if (choices[i].name.toLowerCase().indexOf(term) > -1) {
          matches.push(choices[i]);
        }
      }
      callback(matches);
    }
  });
})();
