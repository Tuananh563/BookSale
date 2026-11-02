const fs = require('fs/promises');
const path = require('path');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudDinary');
const categoryModel = require('../models/category.model');
const { Created, OK } = require('../core/success.response');
const { BadRequestError, NotFoundError } = require('../core/error.response');

async function uploadImageAndReturnUrl(image) {
    const { path: imagePath, filename } = image;

    if (!isCloudinaryConfigured) {
        return `/uploads/categorys/${filename}`;
    }

    const { secure_url } = await cloudinary.uploader.upload(imagePath, {
        folder: 'categorys',
        resource_type: 'image',
    });

    await fs.unlink(imagePath).catch(() => {});
    return secure_url || filename;
}

async function deleteImageFromStorage(imageUrl) {
    if (!imageUrl) return;

    if (isCloudinaryConfigured) {
        await cloudinary.uploader.destroy(getPublicId(imageUrl));
        return;
    }

    const fileName = imageUrl.split('/').pop();
    if (!fileName) return;

    const storagePath = path.join(__dirname, '../uploads/categorys', fileName);
    await fs.rm(storagePath, { force: true }).catch(() => {});
}

function getPublicId(url) {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');

    if (uploadIndex === -1) {
        throw new BadRequestError('Invalid Cloudinary URL');
    }
    const pathParts = parts.slice(uploadIndex + 1);
    const pathWithoutVersion = pathParts[0].startsWith('v') ? pathParts.slice(1) : pathParts;
    const publicIdWithdExt = pathWithoutVersion.join('/');
    const publicId = publicIdWithdExt.substring(0, publicIdWithdExt.lastIndexOf('.'));

    return publicId;
}

class categoryController {
    async createCategory(req, res) {
        const { path, filename } = req.file;
        const { nameCategory } = req.body;
        if (!nameCategory || !path || !filename) {
            await fs.unlink(path);
            throw new BadRequestError('Thiếu thông tin danh mục');
        }
        const imageUrl = await uploadImageAndReturnUrl({ path, filename });

        const newCategory = await categoryModel.create({
            nameCategory,
            imageCategory: imageUrl,
        });

        return new Created({
            message: 'Tạo danh mục thành công',
            metadata: newCategory,
        }).send(res);
    }

    async getAllCategory(req, res) {
        const categories = await categoryModel.find();
        return new OK({
            message: 'Lấy danh mục thành công',
            metadata: categories,
        }).send(res);
    }

    async updateCategory(req, res) {
        const { id } = req.params;
        const { nameCategory } = req.body;
        if (!nameCategory || !id) {
            throw new BadRequestError('Thiếu thông tin danh mục');
        }

        const findCategory = await categoryModel.findById(id);
        if (!findCategory) {
            throw new NotFoundError('Danh mục không tồn tại');
        }

        let imageCategory = findCategory.imageCategory;

        if (req.file) {
            const { path: imagePath, filename } = req.file;
            const newImageUrl = await uploadImageAndReturnUrl({ path: imagePath, filename });

            imageCategory = newImageUrl;

            await deleteImageFromStorage(findCategory.imageCategory);
        }

        const updateCategory = await categoryModel.findByIdAndUpdate(
            id,
            { nameCategory, imageCategory },
            { new: true },
        );

        return new OK({
            message: 'Cập nhật danh mục thành công',
            metadata: updateCategory,
        }).send(res);
    }

    async deleteCategory(req, res) {
        const { id } = req.params;

        if (!id) {
            throw new BadRequestError('Thiếu thông tin danh mục');
        }

        const findCategory = await categoryModel.findById(id);

        if (!findCategory) {
            throw new NotFoundError('Danh mục không tồn tại');
        }

        await deleteImageFromStorage(findCategory.imageCategory);

        await findCategory.deleteOne();

        return new OK({
            message: 'Xóa danh mục thành công',
            metadata: findCategory,
        }).send(res);
    }
}

module.exports = new categoryController();
