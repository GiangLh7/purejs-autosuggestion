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
      minChars: 1,
      /**
       * The delay time to display the suggestion box
       */
      delay: 500,
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
  updateSuggestionContainer() {
  
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
