//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

/* ======== mongoose =========== */

mongoose.connect("mongodb://localhost:27017/todolistDB", { useNewUrlParser: true }); // If db does not exist, it will create a brand new one

const itemsSchema = new mongoose.Schema({
  name: {type: String, required: true}
});

const Item = mongoose.model("Item", itemsSchema); // creating itmes collection with itemsSchema

// creating 3 new default items

const firstItem = new Item({
  name: "Welcome to Todo List"
});

const secondItem = new Item({
  name: "Hit the + button to add an item"
});

const thirdItem = new Item({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [firstItem, secondItem, thirdItem];

// List Schema

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);
// Inserting those 3 items altogether

// Item.insertMany(defaultItems, function(err) {
//   if(err) console.log(err);
//   else console.log("Successfully saved all the items");
// });

/* ======== mongoose =========== */

app.get("/", function(req, res) {

  // const day = date.getDate();

  Item.find({}, function(err, foundItems) {
    if(foundItems.length === 0)
    {
      Item.insertMany(defaultItems, function(err) {
        if(err) console.log(err);
        else console.log("Successfully saved all the items");
      });

      res.redirect("/");
    }
    else res.render("list", { listTitle: "Today", items: foundItems});
  });
});

app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item (
    { name : itemName }
  );

  if(listName === "Today")
  {
    item.save();
    res.redirect("/");
  }
  else
  {
    List.findOne({ name: listName }, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

// app.get("/work", function(req,res) {
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });
//
// app.get("/about", function(req, res) {
//   res.render("about");
// });

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function(err, foundList) {
    if(!err && !foundList)
    {
      const list = new List ({
        name: customListName,
        items: defaultItems
      });

      list.save();
      res.redirect("/" + customListName);
    }
    else res.render("list", { listTitle: foundList.name, items: foundList.items });
  });
});

app.post("/delete", function(req, res) {
  const checkItemId = req.body.check;
  const listName = req.body.listName;

  if(listName === "Today")
  {
    Item.findByIdAndRemove(checkItemId, function(err) {
      if(err) console.log(err);
      else console.log("Successfully deleted the item");
    });

    res.redirect("/");
  }
  else
  {
    List.findOneAndUpdate({ name: listName }, {$pull: {items: {_id: checkItemId}}}, function(err, foundList) {
      res.redirect("/" + listName);
    });
  }
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
