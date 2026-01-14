const express = require('express');
const router = express.Router();
const Task = require('../models/task');
const Category = require('../models/category');
const { isSignedIn } = require('../middleware/auth');

router.use(isSignedIn);

// GET /tasks
router.get('/', async (req, res) => {
  try {
    const { status, priority, category, sort } = req.query;
    
    const filter = { userId: req.session.user._id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.categoryId = category;

    let sortOption = { createdAt: -1 };
    if (sort === 'dueDate') sortOption = { dueDate: 1 };
    if (sort === 'priority') sortOption = { priority: -1 };

    const tasks = await Task.find(filter)
      .populate('categoryId')
      .sort(sortOption);

    const categories = await Category.find({ userId: req.session.user._id });

    res.render('tasks/index', { 
      tasks, 
      categories,
      filters: { status, priority, category, sort }
    });
  } catch (error) {
    console.error(error);
    res.redirect('/');
  }
});

// GET /tasks/new
router.get('/new', async (req, res) => {
  try {
    const categories = await Category.find({ userId: req.session.user._id });
    res.render('tasks/new', { categories, error: null });
  } catch (error) {
    console.error(error);
    res.redirect('/tasks');
  }
});

// POST /tasks
router.post('/', async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, categoryId } = req.body;

    await Task.create({
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      categoryId: categoryId || null,
      userId: req.session.user._id,
    });

    res.redirect('/tasks');
  } catch (error) {
    console.error(error);
    const categories = await Category.find({ userId: req.session.user._id });
    res.render('tasks/new', { categories, error: 'Failed to create task' });
  }
});

// GET /tasks/:id
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.session.user._id,
    }).populate('categoryId');

    if (!task) {
      return res.redirect('/tasks');
    }

    res.render('tasks/show', { task });
  } catch (error) {
    console.error(error);
    res.redirect('/tasks');
  }
});

// GET /tasks/:id/edit
router.get('/:id/edit', async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.session.user._id,
    });

    if (!task) {
      return res.redirect('/tasks');
    }

    const categories = await Category.find({ userId: req.session.user._id });
    res.render('tasks/edit', { task, categories, error: null });
  } catch (error) {
    console.error(error);
    res.redirect('/tasks');
  }
});

// PUT /tasks/:id
router.put('/:id', async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, categoryId } = req.body;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.session.user._id },
      {
        title,
        description,
        status,
        priority,
        dueDate: dueDate || null,
        categoryId: categoryId || null,
      },
      { new: true }
    );

    if (!task) {
      return res.redirect('/tasks');
    }

    res.redirect(`/tasks/${task._id}`);
  } catch (error) {
    console.error(error);
    res.redirect('/tasks');
  }
});

// DELETE /tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.session.user._id,
    });

    res.redirect('/tasks');
  } catch (error) {
    console.error(error);
    res.redirect('/tasks');
  }
});

// PATCH /tasks/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.session.user._id },
      { status }
    );

    res.redirect('/tasks');
  } catch (error) {
    console.error(error);
    res.redirect('/tasks');
  }
});

module.exports = router;