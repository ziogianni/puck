(function() {
 
  'use strict';

  var ENTER_KEY = 13;
  var newTodoDom = document.getElementById('new-todo');
  var newqty = document.getElementById('newqty');
  var syncDom = document.getElementById('sync-wrapper');

  // EDITING STARTS HERE (you dont need to edit anything above this line)

  var db = new PouchDB('couchdb');

  // Replace with remote instance, this just replicates to another local instance.
  var remoteCouch = new PouchDB('https://admin:f709a4963dd5@couchdb-9c5f9d.smileupps.com/couchdb');

  db.changes({
    since: 'now',
    live: true
  }).on('change', showTodos);

  // We have to create a new todo document and enter it in the database
  function addTodo(text,qty) {
    var todo = {
      _id: new Date().toISOString(),
      title: text,
      qty: qty,
      completed: false
    };
    db.put(todo, function callback(err, result) {
      if (!err) {
        console.log('Successfully posted!');
      }
    });
  }

  // Show the current list of todos by reading them from the database
  function showTodos() {
    db.allDocs({include_docs: true, descending: true}, function(err, doc) {
      redrawTodosUI(doc.rows);
    });
  }

  function checkboxChanged(todo, event) {
    todo.completed = event.target.checked;
    db.put(todo);
    if (event.target.checked == true) {
      puckInteract();
      getFeedback();
      } 
  }
function puckInteract(){

  Puck.write('LED1.set();\n');
  }
  function getFeedback() {
   setWatch(function() {
  Puck.write('LED1.reset();\n');
}, BTN, {edge:"rising", debounce:50, repeat:true});
    //Puck.eval("BTN.read()",function(x) { if (x == true) Puck.write('LED1.reset();\n'); }) 
    }
  // User pressed the delete button for a todo, delete it
  function deleteButtonPressed(todo) {
    db.remove(todo);
  }

  // The input box when editing a todo has blurred, we should save
  // the new title or delete the todo if the title is empty
  function todoBlurred(todo, event) {
    var trimmedText = event.target.value.trim();
    if (!trimmedText) {
      db.remove(todo);
    } else {
      todo.title = trimmedText;
      db.put(todo);
    }
  }
  
  // The input box when editing a todo has blurred, we should save
  // the new title or delete the todo if the title is empty
  function qtyBlurred(todo, event) {
    var trimmedText = event.target.value.trim();
    if (!trimmedText) {
      db.remove(todo);
    } else {
      todo.qty = trimmedText;
      db.put(todo);
    }
  }


  // Initialise a sync with the remote server
  function sync() {
    syncDom.setAttribute('data-sync-state', 'syncing');
    var opts = {live: true};
    db.sync(remoteCouch, {
  live: true
}).on('error', function(err){console.log(JSON.stringify(err));});
    //db.replicate.to(remoteCouch, opts, syncError);
    //db.replicate.from(remoteCouch, opts, syncError);
  }

  // EDITING STARTS HERE (you dont need to edit anything below this line)

  // There was some form or error syncing
  function syncError() {
    syncDom.setAttribute('data-sync-state', 'error');
  }

  // User has double clicked a todo, display an input so they can edit the title
  function todoDblClicked(todo) {
    var div = document.getElementById('li_' + todo._id);
    var inputEditTodo = document.getElementById('input_' + todo._id);
    div.className = 'editing';
    inputEditTodo.focus();

  }
    // User has double clicked a todo, display an input so they can edit the title
  function qtyDblClicked(todo) {
    var div = document.getElementById('li_' + todo._id);
    var inputEditQty = document.getElementById('input_qty' + todo._id);
    div.className = 'editing';
    inputEditQty.focus();
  }

  // If they press enter while editing an entry, blur it to trigger save
  // (or delete)
  function todoKeyPressed(todo, event) {
    if (event.keyCode === ENTER_KEY) {
      var inputEditTodo = document.getElementById('input_' + todo._id);
      inputEditTodo.blur();
    }
  }
  
  function qtyKeyPressed(todo, event) {
    if (event.keyCode === ENTER_KEY) {
      var inputEditQty = document.getElementById('input_qty' + todo._id);
      inputEditQty.blur();
    }
  }

  // Given an object representing a todo, this will create a list item
  // to display it.
  function createTodoListItem(todo) {
     var qty = document.createElement('input');
     qty.className = 'qty';
     qty.type = 'text';
     qty.value = todo.qty;
     qty.addEventListener('dblclick', qtyDblClicked.bind(this, todo));
    
    var checkbox = document.createElement('input');
    checkbox.className = 'toggle';
    checkbox.type = 'checkbox';
    checkbox.addEventListener('change', checkboxChanged.bind(this, todo));

    var label = document.createElement('label');
    label.appendChild( document.createTextNode(todo.title));
    label.addEventListener('dblclick', todoDblClicked.bind(this, todo));

    var deleteLink = document.createElement('button');
    deleteLink.className = 'destroy';
    deleteLink.addEventListener( 'click', deleteButtonPressed.bind(this, todo));

    var divDisplay = document.createElement('div');
    divDisplay.className = 'view';
    divDisplay.appendChild(checkbox);
    divDisplay.appendChild(label);
    divDisplay.appendChild(qty);
    divDisplay.appendChild(deleteLink);

    var inputEditTodo = document.createElement('input');
    inputEditTodo.id = 'input_' + todo._id;
    inputEditTodo.className = 'edit';
    inputEditTodo.value = todo.title;
    inputEditTodo.addEventListener('keypress', qtyKeyPressed.bind(this, todo));
    inputEditTodo.addEventListener('blur', todoBlurred.bind(this, todo));

    var inputEditQty = document.createElement('input');
    inputEditQty.id = 'input_qty' + todo._id;
    inputEditQty.className = 'edit';
    inputEditQty.value = todo.qty;
    inputEditQty.addEventListener('keypress', qtyKeyPressed.bind(this, todo));
    inputEditQty.addEventListener('blur', qtyBlurred.bind(this, todo));
    
    var li = document.createElement('li');
    li.id = 'li_' + todo._id;
    li.appendChild(divDisplay);
    li.appendChild(inputEditTodo);
    li.appendChild(inputEditQty);
    
    if (todo.completed) {
      li.className += 'complete';
      checkbox.checked = true;
    }

    return li;
  }
 
  function redrawTodosUI(todos) {
    var ul = document.getElementById('todo-list');
    ul.innerHTML = '';
    todos.forEach(function(todo) {
      ul.appendChild(createTodoListItem(todo.doc));
    });
  }

  function newTodoKeyPressHandler( event ) {
    if (event.keyCode === ENTER_KEY) {
      addTodo(newTodoDom.value,newqty.value);
      newTodoDom.value = '';
      newqty.value = '';
    }
  }

  function addEventListeners() {
    newTodoDom.addEventListener('keypress', newTodoKeyPressHandler, false);
    newqty.addEventListener('keypress', newTodoKeyPressHandler, false);
  }

  addEventListeners();
  showTodos();

  if (remoteCouch) {
    sync();
  }

})();
