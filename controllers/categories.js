const express = require('express');
const router = express.Router();
const Category = require('../models/category');
const Task = require('../models/task');
const { isSignedIn } = require('../middleware/auth');

router.use(isSignedIn);

// GET /categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ userId: req.session.user._id }).sort({ name: 1 });
    
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const taskCount = await Task.countDocuments({ categoryId: category._id });
        return { ...category.toObject(), taskCount };
      })
    );

    res.render('categories/index', { categories: categoriesWithCount });
  } catch (error) {
    console.error(error);
    res.redirect('/tasks');
  }
});

// GET /categories/new
router.get('/new', (req, res) => {
  res.render('categories/new', { error: null });
});

// POST /categories
router.post('/', async (req, res) => {
  try {
    const { name, color } = req.body;

    await Category.create({
      name,
      color: color || '#6366f1',
      userId: req.session.user._id,
    });

    res.redirect('/categories');
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      res.render('categories/new', { error: 'Category name already exists' });
    } else {
      res.render('categories/new', { error: 'Failed to create category' });
    }
  }
});

// GET /categories/:id
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.session.user._id,
    });

    if (!category) {
      return res.redirect('/categories');
    }

    const tasks = await Task.find({ categoryId: category._id }).sort({ createdAt: -1 });

    res.render('categories/show', { category, tasks });
  } catch (error) {
    console.error(error);
    res.redirect('/categories');
  }
});

// GET /categories/:id/edit
router.get('/:id/edit', async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.session.user._id,
    });

    if (!category) {
      return res.redirect('/categories');
    }

    res.render('categories/edit', { category, error: null });
  } catch (error) {
    console.error(error);
    res.redirect('/categories');
  }
});

// PUT /categories/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, color } = req.body;

    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, userId: req.session.user._id },
      { name, color },
      { new: true }
    );

    if (!category) {
      return res.redirect('/categories');
    }

    res.redirect('/categories');
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      const category = await Category.findById(req.params.id);
      res.render('categories/edit', { category, error: 'Category name already exists' });
    } else {
      res.redirect('/categories');
    }
  }
});

// DELETE /categories/:id
router.delete('/:id', async (req, res) => {
  try {
    await Task.updateMany(
      { categoryId: req.params.id, userId: req.session.user._id },
      { $unset: { categoryId: '' } }
    );

    await Category.findOneAndDelete({
      _id: req.params.id,
      userId: req.session.user._id,
    });

    res.redirect('/categories');
  } catch (error) {
    console.error(error);
    res.redirect('/categories');
  }
});

module.exports = router;