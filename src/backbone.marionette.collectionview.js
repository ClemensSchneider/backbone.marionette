// Collection View
// ---------------

// A view that iterates over a Backbone.Collection
// and renders an individual ItemView for each model.
Marionette.CollectionView = Marionette.View.extend({
  constructor: function(){
    Marionette.View.prototype.constructor.apply(this, arguments);
    this.initialEvents();
  },

  // Configured the initial events that the collection view 
  // binds to. Override this method to prevent the initial
  // events, or to add your own initial events.
  initialEvents: function(){
    if (this.collection){
      this.bindTo(this.collection, "add", this.addChildView, this);
      this.bindTo(this.collection, "remove", this.removeItemView, this);
      this.bindTo(this.collection, "reset", this.render, this);
    }
  },

  // Handle a child item added to the collection
  addChildView: function(item, collection, options){
    var ItemView = this.getItemView();
    return this.addItemView(item, ItemView, options.index);
  },

  // Loop through all of the items and render 
  // each of them with the specified `itemView`.
  render: function(){
    var that = this;
    var ItemView = this.getItemView();
    var EmptyView = this.options.emptyView || this.emptyView;

    if (this.beforeRender) { this.beforeRender(); }
    this.trigger("collection:before:render", this);

    this.closeChildren();

    if (this.collection) {
      if (this.collection.length === 0 && EmptyView) {
        this.addItemView(new Backbone.Model(), EmptyView);
      } else {
        this.collection.each(function(item, index){
          that.addItemView(item, ItemView, index);
        });
      }
    }

    if (this.onRender) { this.onRender(); }
    this.trigger("collection:rendered", this);
  },

  // Retrieve the itemView type, either from `this.options.itemView`
  // or from the `itemView` in the object definition. The "options"
  // takes precedence.
  getItemView: function(){
    var itemView = this.options.itemView || this.itemView;

    if (!itemView){
      var err = new Error("An `itemView` must be specified");
      err.name = "NoItemViewError";
      throw err;
    }

    return itemView;
  },

  // Render the child item's view and add it to the
  // HTML for the collection view.
  addItemView: function(item, ItemView, index){
    var that = this;

    var view = this.buildItemView(item, ItemView);
    var childBinding = this.bindTo(view, "all", function(){

      // get the args, prepend the event name
      // with "itemview:" and insert the child view
      // as the first event arg (after the event name)
      var args = slice.call(arguments);
      args[0] = "itemview:" + args[0];
      args.splice(1, 0, view);

      that.trigger.apply(that, args);
    });
    this.childBindings = this.childBindings || {};
    this.childBindings[view.cid] = childBinding;

    this.storeChild(view);

    view.render();
    this.appendHtml(this, view, index);

    this.trigger("item:added", view, index);
  },

  // Build an `itemView` for every model in the collection. 
  buildItemView: function(item, ItemView){
    var view = new ItemView({
      model: item
    });
    return view;
  },

  // Remove the child view and close it
  removeItemView: function(item){
    var view = this.children[item.cid];
    if (view){
      var childBinding = this.childBindings[view.cid];
      if (childBinding) {
        this.unbindFrom(childBinding);
        delete this.childBindings[view.cid];
      }
      view.close();
      delete this.children[item.cid];
    }
    this.trigger("item:removed", view);
  },

  // Append the HTML to the collection's `el`.
  // Override this method to do something other
  // then `.append`.
  appendHtml: function(collectionView, itemView, index){
    collectionView.$el.append(itemView.el);
  },

  // Store references to all of the child `itemView`
  // instances so they can be managed and cleaned up, later.
  storeChild: function(view){
    if (!this.children){
      this.children = {};
    }
    this.children[view.model.cid] = view;
  },

  // Handle cleanup and other closing needs for
  // the collection of views.
  close: function(){
    this.trigger("collection:before:close");
    this.closeChildren();
    Marionette.View.prototype.close.apply(this, arguments);
    this.trigger("collection:closed");
  },

  // Close the child views that this collection view
  // is holding on to, if any
  closeChildren: function(){
    var that = this;
    if (this.children){
      _.each(_.clone(this.children), function(childView){
        that.removeItemView(childView.model);
      });
    }
  }
});

