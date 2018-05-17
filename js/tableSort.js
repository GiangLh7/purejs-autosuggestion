class TableSort {
	constructor(tableId, tableData) {
		this.sortKey = "value";
		this.tableId = tableId;
		this.tableData = tableData || [];
		this.sortOrder = -1;
		this.sortTableData("value");
		this.render();
	}

	add(data) {
		const table = document.getElementById(this.tableId);
		let tempIdx = 0;
		
		for(var i = 0, l = this.tableData.length; i < l; i++) {
			const temp = this.tableData[i];
			if ( (data[this.sortKey] <= temp[this.sortKey] && this.sortOrder < 0) || (data[this.sortKey] >= temp[this.sortKey] && this.sortOrder > 0) ){
				tempIdx = i+1;				
			}
		}
		
		data.key = this.tableData.length;
		this.tableData.splice(tempIdx, 0, data);
		const fragment = document.createDocumentFragment();
		this.constructDataItem(fragment, data);
		let item = table.querySelectorAll("li")[tempIdx];
		if (item) {
			table.insertBefore(fragment, item);
		}
		else {
			table.appendChild(fragment);
		}	
	}

	constructDataItem(fragment, data) {
		let li = document.createElement('li');
		li.innerText = data.value;
		li.setAttribute("data-key", data.key);
		fragment.appendChild(li);
	}

	render() {
		const table = document.getElementById(this.tableId);
		if (!table) {
			return;
		}

		let html = "";

		this.tableData.forEach((data) => {
			html += this.renderDataItem(data);
		});

		table.innerHTML = html;
	}	

	renderDataItem(data) {
		return `<li data-key="${data.key}">${data.value}</li>`;
	}

	sortTableData(colNo) {
		return this.tableData.sort((a, b) => {
			if (a[colNo] < b[colNo]) {
				return -1 * this.sortOrder;
			}
			if (a[colNo] > b[colNo]) {
                return this.sortOrder;
            }
            return 0;
		});
	}
}

(function(){
  if (typeof define === 'function' && define.amd) {
    define('autoComplete', function () { return TableSort; });
  }
  else if (typeof module !== 'undefined' && module.exports) {
    module.exports = TableSort;
  }
  else {
    window.TableSort = TableSort;
  }
})();
