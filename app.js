var budgetController = (function(){

	var Expense = function(id, description, value){
		this.id = id;
		this.description = description;
		this.value = value;
		this.percentage = -1;
	};

	Expense.prototype.calcPercentage = function(totalIncome){
		if (totalIncome > 0) {
			this.percentage = Math.round((this.value / totalIncome) * 100);			
		} else {
			this.percentage = -1;
		}
    };
    
    Expense.prototype.getPercentage = function(){
		return this.percentage;
	};
    
    var Income = function(id, description, value)
    {
        this.id = id;
        this.description = description;
        this.value = value;
    };

	var calculateTotal = function(type){
		var sum = 0;
		data.allItems[type].forEach(function(cur){
			sum += cur.value;
		});
		data.totals[type] = sum;
	}

    var data = {
        allItems: {
            exp: [],
            inc: [],
        },
        totals: {
            exp: 0,
            inc: 0,
        },
        budget: 0,
        percentage: -1,
    };

    return {
        addItem: function(type, des, val){
            var newItem, ID;
            
            // id = lastId + 1
            if(data.allItems[type].length > 0)
            {
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
            }
            else
            {
                ID = 0;
            }
            

            // Create new item based in "inc" or "exp"
            if(type === 'exp')
            {
                newItem = new Expense(ID, des, val);
            }
            else if (type === 'inc')
            {
                newItem = new Income(ID, des, val);
            }

            // Push it our data structure
            data.allItems[type].push(newItem);

            //Return the new element
            return newItem;
        },

        deleteItem: function(type, id){
            var ids, index;

            ids = data.allItems[type].map(function(current){
                return current.id;
            })
            index = ids.indexOf(id);

            if(index !== -1)
            {
                data.allItems[type].splice(index, 1);
            }
        },

        calculateBudget: function () {
            // Calculate total income and expenses
            calculateTotal('exp');
            calculateTotal('inc');
            // Calculate the budget: income - expenses
            data.budget = data.totals.inc - data.totals.exp;

            // Calculate the percentage of income that we spent
            if(data.totals.exp > 0)
            {
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
            }
            else{
                data.percentage = -1;
            }
            
        },

		calculatePercentages: function(){
			// calculate exoense percentage
			data.allItems.exp.forEach(function(cur){
				cur.calcPercentage(data.totals.inc);
			});
		},

		getPercentages: function(){
			var allPerc = data.allItems.exp.map(function(cur){
				return cur.getPercentage();
			});

			return allPerc;
		},

        getBudget: function(){
            return{
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage,
            }
        },

        test: function(){
            console.log(data);
        }
    };

})();

UIController = (function(){

    var DOMstrings = {
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputButton: '.add__btn',
        incomeContainer: '.income__list',
        expensesContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expensesLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        container: '.container',
        allPercLabel: '.item__percentage',
        dateLabel: '.budget__title--month',
    }

    var formatNumber = function(number, type)
    {
        var numberSplit, int, dec, type;
        /*
            + or - before number
            exactly 2 decimal points
            comma separating the thousands

            2310.4567 -> 2,310.46
            2000 -> 2,000.00

        */

        number = Math.abs(number);
        number = number.toFixed(2);

        numberSplit = number.split(".");

        int = numberSplit[0];
        if(int.length > 3)
        {
            int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, 3); // input 23510, output 23,510
        }

        dec = numberSplit[1];

        return  (type === "exp" ? "-" : "+") + " " + int + "." + dec;

    };

    var nodeListForEach = function(list, callback)
    {
        for(var i = 0; i < list.length; i++)
        {
            callback(list[i], i)
        }
    };

    return {
        
        getInput: function(){
            return{
                type: document.querySelector(DOMstrings.inputType).value,
                description: document.querySelector(DOMstrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMstrings.inputValue).value),
            };
        },

        addListItem: function(object, type){
            var html, newHtml, element;
            // Create HTML string with placeholder text
            if(type === 'inc')
            {
                element = DOMstrings.incomeContainer;
                html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%des%</div><div class="right clearfix"><div class="item__value">%val%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            }
            else if(type === 'exp')
            {
                element = DOMstrings.expensesContainer;
                html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%des%</div><div class="right clearfix"><div class="item__value">%val%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            }
            // Replace the placeholder text with some actual data
            newHtml = html.replace('%id%', object.id);
            newHtml = newHtml.replace('%des%', object.description);
            newHtml = newHtml.replace('%val%', formatNumber(object.value, type));
            // Insert the HTML into the DOM
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
        },

        clearFields: function(){
            var fields, fieldArray;
            fields = document.querySelector(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);

            fieldArray = Array.prototype.slice.call(fields);
            fieldArray.forEach(function(current, index, array){
                current.value = "";
            })

            fieldArray[0].focus();
        },
        deleteListItems: function(selectorID)
        {
            var element = document.getElementById(selectorID);
            element.parentNode.removeChild(element);
        },

        displayBudget: function(object){
            var type;
            object.budget > 0 ? type = 'inc' : type = 'exp';
            document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(object.budget, type);
            document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(object.totalInc, 'inc');
            document.querySelector(DOMstrings.expensesLabel).textContent = formatNumber(object.totalExp, 'exp');
            if(object.percentage > 0)
            {
                document.querySelector(DOMstrings.percentageLabel).textContent = object.percentage + "%";
            }
            else
            {
                document.querySelector(DOMstrings.percentageLabel).textContent = "---";
            }
            
        },

        displayPercentages: function(percentages)
        {
            var fields = document.querySelectorAll(DOMstrings.allPercLabel);



            nodeListForEach(fields, function(current, index){
                if (percentages > 0)
                {
                    current.textContent = percentages[index] + "%";
                }
                else 
                {
                    current.textContent = "---";
                }
            })
        },
        displayDate: function(){
            var now, month, year,months;
            now = new Date();

            year = now.getFullYear();
            month = now.getMonth();
            
            months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ];
            document.querySelector(DOMstrings.dateLabel).textContent = months[month] + " " + year;

        },
        changeType: function()
        {
            var fields = document.querySelectorAll(DOMstrings.inputType + ',' + DOMstrings.inputDescription + ',' + DOMstrings.inputValue);
            nodeListForEach(fields , function(current){
                current.classList.toggle('red-focus');
            })

            document.querySelector(DOMstrings.inputButton).classList.toggle('red');

        },

        getDOMstrings: function(){
            return DOMstrings;
        }
    };

})();

controller = (function(budgetCtrl, UICtrl){
    
    var setupEventListener = function(){
        var DOM = UICtrl.getDOMstrings();

        document.querySelector(DOM.inputButton).addEventListener('click', ctrlAddItem);

        document.addEventListener('keypress', function(event){
            if (event.keyCode === 13 || event.which === 13)
            {
                ctrlAddItem();
            }
        })

        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);
        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changeType);

    }
    
    var updateBudget = function(){
        // 1. Calculate the budget
        budgetCtrl.calculateBudget();

        // 2. Return the budget
        var budget = budgetCtrl.getBudget();

        // 3. Display the budget on the UI
        UICtrl.displayBudget(budget);
    }

    var updatePercentages = function(){
        // 1. Calculate percentages
        budgetCtrl.calculatePercentages();
    
        // 2. Read percentages from the budget controller 
        var percentages = budgetCtrl.getPercentages();

        // 3. Update the UI with the new percentages
       UICtrl.displayPercentages(percentages);
    }


    function ctrlAddItem(){
        var input, newItem;
        // 1. Get the field input data
        input = UICtrl.getInput();

        if (input.description !== "" && !isNaN(input.value) && input.value > 0)
        {
            // 2. Add the item to budget controller
            newItem = budgetCtrl.addItem(input.type, input.description, input.value);

            // 3. Add the item to the UI
            UICtrl.addListItem(newItem, input.type);

            // 5. Calculate and update budget
            updateBudget();

            // 6 Update percentages
            updatePercentages();
       }
        //console.log(newItem);
    };

    function ctrlDeleteItem(event){
        var itemId , splitId, type, id;
        
       itemId = event.target.parentNode.parentNode.parentNode.parentNode.id;
        if(itemId)
        {
            splitId = itemId.split('-');
            type = splitId[0];
            id = parseInt(splitId[1]);

            // 1 Delete the item from the data structure
            budgetCtrl.deleteItem(type, id);

            // 2 Delete the item from the UI
            UICtrl.deleteListItems(itemId);

            // 3 Update and show the new budget
            updateBudget();

            // 4 Update percentages
           
        }
    }

    return{
        init: function(){
            UICtrl.displayDate();
            UICtrl.displayBudget({
                budget: 0,
                totalInc: 0,
                totalExp: 0,
                percentage: -1,
            });
            console.log('Application has been started');
            setupEventListener();
        }
    }


})(budgetController, UIController);

controller.init();