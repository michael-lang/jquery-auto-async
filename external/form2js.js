/**
 * Copyright (c) 2010 Maxim Vasiliev
 * Copyright 2012, AUTHORS.txt
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */


form2js = function()
{
	"use strict";
	/**
	 * Returns form values represented as Javascript object
	 * "name" attribute defines structure of resulting object
	 *
	 * @param rootNode {Element|String} root form element (or it's id) or array of root elements
	 * @param json {Object} - the data element to update with the form values (empty to start with a new object)
	 * @param delimiter {String} structure parts delimiter defaults to '.'
	 * @param skipEmpty {Boolean} should skip empty text values, defaults to true
	 * @param emptyToNull {Boolean} should empty values be converted to null?
	 * @param nodeCallback {Function} custom function to get node value
	 * @param useIdIfEmptyName {Boolean} if true value of id attribute of field will be used if name of field is empty
	 */
	function form2js(prms)
	{
		if (typeof prms.skipEmpty == 'undefined' || prms.skipEmpty == null) prms.skipEmpty = true;
		if (typeof prms.emptyToNull == 'undefined' || prms.emptyToNull == null) prms.emptyToNull = true;
		if (typeof prms.delimiter == 'undefined' || prms.delimiter == null) prms.delimiter = '.';
		if (arguments.length < 6) prms.useIdIfEmptyName = false;
		if (!prms.json) { prms.json = new Object(); }

		prms.rootNode = typeof prms.rootNode == 'string' ? document.getElementById(prms.rootNode) : prms.rootNode;

		var formValues = [],
			currNode,
			i = 0;

		/* If prms.rootNode is array - combine values */
		if (prms.rootNode.constructor == Array || (typeof NodeList != 'undefined' && prms.rootNode.constructor == NodeList))
		{
			while(currNode = prms.rootNode[i++])
			{
				formValues = formValues.concat(getFormValues(extend({}, prms, {rootNode: currNode})));
			}
		}
		else
		{
			formValues = getFormValues(prms);
		}
		extend(prms, { nameValues: formValues });

		return processNameValues(prms);
	};
	function extend(){
		for(var i=1; i<arguments.length; i++)
			for(var key in arguments[i])
				if(arguments[i].hasOwnProperty(key))
					arguments[0][key] = arguments[i][key];
		return arguments[0];
	};
	/**
	 * Processes collection of { name: 'name', value: 'value' } objects.
	 * @param json - the data element to update with the form values (empty to start with a new object)
	 * @param nameValues
	 * @param skipEmpty if true skips elements with value == '' or value == null
	 * @param delimiter
	 * @param emptyToNull
	 */
	function processNameValues(prms)
	{
		var arrays = {},
			i, j, k, l,
			value,
			nameParts,
			currResult,
			arrNameFull,
			arrName,
			arrIdx,
			namePart,
			name,
			_nameParts;

		for (i = 0; i < prms.nameValues.length; i++)
		{
			value = prms.nameValues[i].value;

			if (prms.emptyToNull && (value === '')) { value = null; }
			if (prms.skipEmpty && (value === '' || value === null)) continue;

			name = prms.nameValues[i].name;
			if (typeof name === 'undefined') continue;

			_nameParts = name.split(prms.delimiter);
			nameParts = [];
			currResult = prms.json;
			arrNameFull = '';

			for(j = 0; j < _nameParts.length; j++)
			{
				namePart = _nameParts[j].split('][');
				if (namePart.length > 1)
				{
					for(k = 0; k < namePart.length; k++)
					{
						if (k == 0)
						{
							namePart[k] = namePart[k] + ']';
						}
						else if (k == namePart.length - 1)
						{
							namePart[k] = '[' + namePart[k];
						}
						else
						{
							namePart[k] = '[' + namePart[k] + ']';
						}

						arrIdx = namePart[k].match(/([a-z_]+)?\[([a-z_][a-z0-9_]+?)\]/i);
						if (arrIdx)
						{
							for(l = 1; l < arrIdx.length; l++)
							{
								if (arrIdx[l]) nameParts.push(arrIdx[l]);
							}
						}
						else{
							nameParts.push(namePart[k]);
						}
					}
				}
				else
					nameParts = nameParts.concat(namePart);
			}

			for (j = 0; j < nameParts.length; j++)
			{
				namePart = nameParts[j];

				if (namePart.indexOf('[]') > -1 && j == nameParts.length - 1)
				{
					arrName = namePart.substr(0, namePart.indexOf('['));
					arrNameFull += arrName;

					if (!currResult[arrName]) currResult[arrName] = [];
					currResult[arrName].push(value);
				}
				else if (namePart.indexOf('[') > -1)
				{
					arrName = namePart.substr(0, namePart.indexOf('['));
					arrIdx = namePart.replace(/(^([a-z_]+)?\[)|(\]$)/gi, '');

					/* Unique array name */
					arrNameFull += '_' + arrName + '_' + arrIdx;

					/*
					 * Because arrIdx in field name can be not zero-based and step can be
					 * other than 1, we can't use them in target array directly.
					 * Instead we're making a hash where key is arrIdx and value is a reference to
					 * added array element
					 */

					if (!arrays[arrNameFull]) arrays[arrNameFull] = {};
					if (arrName != '' && !currResult[arrName]) currResult[arrName] = [];

					if (j == nameParts.length - 1)
					{
						if (arrName == '')
						{
							currResult.push(value);
							arrays[arrNameFull][arrIdx] = currResult[currResult.length - 1];
						}
						else
						{
							currResult[arrName].push(value);
							arrays[arrNameFull][arrIdx] = currResult[arrName][currResult[arrName].length - 1];
						}
					}
					else
					{
						if (!arrays[arrNameFull][arrIdx])
						{
							if ((/^[a-z_]+\[?/i).test(nameParts[j+1])) currResult[arrName].push({});
							else currResult[arrName].push([]);

							arrays[arrNameFull][arrIdx] = currResult[arrName][currResult[arrName].length - 1];
						}
					}

					currResult = arrays[arrNameFull][arrIdx];
				}
				else
				{
					arrNameFull += namePart;

					if (j < nameParts.length - 1) /* Not the last part of name - means object */
					{
						if (!currResult[namePart]) currResult[namePart] = {};
						currResult = currResult[namePart];
					}
					else
					{
						currResult[namePart] = value;
					}
				}
			}
		}

		return prms.json;
	};
	/**
	 * 
	 * @param rootNode
	 * @param nodeCallback
	 * @param useIdIfEmptyName
	 */
    function getFormValues(prms)
    {
        var result = extractNodeValues(extend({}, prms, {node:prms.rootNode}));
        return result.length > 0 ? result : getSubFormValues(prms);
    };
	/**
	 * 
	 * @param rootNode
	 * @param nodeCallback
	 * @param useIdIfEmptyName
	 */
    function getSubFormValues(prms)
	{
		var result = [],
			currentNode = prms.rootNode.firstChild;
		
		while (currentNode)
		{
			var currentResult = extractNodeValues(extend({}, prms, {node:currentNode}));
            		for (var i = 0; i < currentResult.length;i++ ) {
                		if(currentResult[i].value !== null) {
                    			result[result.length] = currentResult[i];                    
                		}
            		}
			currentNode = currentNode.nextSibling;
		}

		return result;
	};
	/**
	 * 
	 * @param node
	 * @param nodeCallback
	 * @param useIdIfEmptyName
	 */
    function extractNodeValues(prms) {
        var callbackResult, fieldValue, result, fieldName = getFieldName(prms);

        callbackResult = prms.nodeCallback && prms.nodeCallback(prms.node);

        if (callbackResult && callbackResult.name) {
            result = [callbackResult];
        }
        else if (fieldName != '' && prms.node.nodeName.match(/INPUT|TEXTAREA/i)) {
            fieldValue = getFieldValue(prms.node);   
	        if (fieldValue == null && prms.node.type == 'radio')
                result = [];
            else
                result = [ { name: fieldName, value: fieldValue} ];
        }
        else if (fieldName != '' && prms.node.nodeName.match(/SELECT/i)) {
	        fieldValue = getFieldValue(prms.node);
	        result = [ { name: fieldName.replace(/\[\]$/, ''), value: fieldValue } ];
        }
        else {
            result = getSubFormValues(extend({}, prms, {rootNode:prms.node}));
        }

        return result;
    };
	/**
	 * 
	 * @param node
	 * @param useIdIfEmptyName
	 */
	function getFieldName(prms)
	{
		if (prms.node.name && prms.node.name != '') return prms.node.name;
		else if (prms.useIdIfEmptyName && prms.node.id && prms.node.id != '') return prms.node.id;
		else return '';
	};


	function getFieldValue(fieldNode)
	{
		if (fieldNode.disabled) return null;
		
		switch (fieldNode.nodeName) {
			case 'INPUT':
			case 'TEXTAREA':
				switch (fieldNode.type.toLowerCase()) {
					case 'radio':
						if (fieldNode.checked) return fieldNode.value;
						break;
					case 'checkbox':
                        if (fieldNode.checked && fieldNode.value === 'true' || fieldNode.value === 'on') return true;
                        if (!fieldNode.checked && fieldNode.value === 'true' || fieldNode.value === 'on') return false;
						if (fieldNode.checked) return fieldNode.value;
						break;

					case 'button':
					case 'reset':
					case 'submit':
					case 'image':
						return '';
						break;

					default:
						return fieldNode.value;
						break;
				}
				break;

			case 'SELECT':
				return getSelectedOptionValue(fieldNode);
				break;

			default:
				break;
		}

		return null;
	};

	function getSelectedOptionValue(selectNode)
	{
		var multiple = selectNode.multiple,
			result = [],
			options,
			i, l;

		if (!multiple) return selectNode.value;

		for (options = selectNode.getElementsByTagName('option'), i = 0, l = options.length; i < l; i++)
		{
			if (options[i].selected) result.push(options[i].value);
		}

		return result;
	};

	return form2js;
}();