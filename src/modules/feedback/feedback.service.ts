import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { Feedback, FeedbackDocument } from './schemas/feedback.schema';
import { BorrowTransaction } from '../borrow-transactions/schemas/borrow-transactions.schema';
import { Businesses } from '../businesses/schemas/businesses.schema';
import { Customers } from '../users/schemas/customer.schema';
import { BorrowTransactionStatus } from 'src/common/constants/borrow-transaction-status.enum';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback.name) private feedbackModel: Model<FeedbackDocument>,
    @InjectModel(BorrowTransaction.name)
    private borrowTransactionModel: Model<BorrowTransaction>,
    @InjectModel(Businesses.name) private businessesModel: Model<Businesses>,
    @InjectModel(Customers.name) private customersModel: Model<Customers>,
  ) {}

  private async updateBusinessRating(businessId: Types.ObjectId) {
    const stats = await this.feedbackModel.aggregate<{
      averageRating: number;
      totalReviews: number;
    }>([
      { $match: { businessId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const { averageRating, totalReviews } = stats[0] || {
      averageRating: 0,
      totalReviews: 0,
    };

    await this.businessesModel.findByIdAndUpdate(businessId, {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
    });
  }

  async create(
    userId: string,
    createFeedbackDto: CreateFeedbackDto,
  ): Promise<APIResponseDto> {
    const customer = await this.customersModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const borrowTransaction = await this.borrowTransactionModel.findById(
      createFeedbackDto.borrowTransactionId,
    );

    if (!borrowTransaction) {
      throw new NotFoundException('Borrow transaction not found');
    }

    if (borrowTransaction.customerId.toString() !== customer._id.toString()) {
      throw new ForbiddenException(
        'You can only feedback your own transactions',
      );
    }

    if (
      ![
        BorrowTransactionStatus.RETURNED,
        BorrowTransactionStatus.RETURN_LATE,
      ].includes(borrowTransaction.status as BorrowTransactionStatus)
    ) {
      throw new BadRequestException(
        'You can only feedback after returning the product',
      );
    }

    const existingFeedback = await this.feedbackModel.findOne({
      borrowTransactionId: new Types.ObjectId(
        createFeedbackDto.borrowTransactionId,
      ),
    });

    if (existingFeedback) {
      throw new BadRequestException(
        'Feedback already exists for this transaction',
      );
    }

    const feedback = new this.feedbackModel({
      customerId: customer._id,
      businessId: borrowTransaction.businessId,
      borrowTransactionId: borrowTransaction._id,
      productId: borrowTransaction.productId,
      rating: createFeedbackDto.rating,
      comment: createFeedbackDto.comment,
      isEdited: false,
    });

    await feedback.save();

    // Update business rating
    await this.updateBusinessRating(borrowTransaction.businessId);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Feedback created successfully',
      data: feedback,
    };
  }

  async findAll(
    page = 1,
    limit = 10,
    rating?: number,
  ): Promise<APIPaginatedResponseDto<Feedback[]>> {
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};
    if (rating !== undefined && rating >= 1 && rating <= 5) {
      query.rating = rating;
    }

    const [feedbacks, total] = await Promise.all([
      this.feedbackModel
        .find(query)
        .populate('customerId', 'userId')
        .populate('businessId', 'businessName businessLogoUrl')
        .populate('productId', 'productName image')
        .populate('borrowTransactionId', 'borrowDate returnDate status')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.feedbackModel.countDocuments(query),
    ]);

    return {
      statusCode: HttpStatus.OK,
      message: 'Feedbacks retrieved successfully',
      data: feedbacks,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByBusiness(
    businessId: string,
    page = 1,
    limit = 10,
    rating?: number,
  ): Promise<APIPaginatedResponseDto<Feedback[]>> {
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {
      businessId: new Types.ObjectId(businessId),
    };
    if (rating !== undefined && rating >= 1 && rating <= 5) {
      query.rating = rating;
    }

    const [feedbacks, total] = await Promise.all([
      this.feedbackModel
        .find(query)
        .populate({
          path: 'customerId',
          select: 'userId fullName',
          populate: {
            path: 'userId',
            select: 'avatar',
          },
        })
        .populate('productId', 'productName image')
        .populate('businessId', 'businessName businessLogoUrl')
        .populate('borrowTransactionId', 'borrowDate returnDate status')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.feedbackModel.countDocuments(query),
    ]);

    const ratingStats = await this.feedbackModel.aggregate<{
      averageRating: number;
      totalFeedbacks: number;
    }>([
      { $match: query },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalFeedbacks: { $sum: 1 },
        },
      },
    ]);

    const stats = ratingStats[0] || { averageRating: 0, totalFeedbacks: 0 };
    const averageRating = Math.round(stats.averageRating * 10) / 10;

    return {
      statusCode: HttpStatus.OK,
      message: `Business feedbacks retrieved successfully. Average rating: ${averageRating} (${stats.totalFeedbacks} reviews)`,
      data: feedbacks,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByCustomer(
    userId: string,
    page = 1,
    limit = 10,
    rating?: number,
  ): Promise<APIPaginatedResponseDto<Feedback[]>> {
    const customer = await this.customersModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const skip = (page - 1) * limit;
    const query: Record<string, any> = { customerId: customer._id };
    if (rating !== undefined && rating >= 1 && rating <= 5) {
      query.rating = rating;
    }

    const [feedbacks, total] = await Promise.all([
      this.feedbackModel
        .find(query)
        .populate('businessId', 'businessName businessLogoUrl')
        .populate('productId', 'productName image')
        .populate('borrowTransactionId', 'borrowDate returnDate status')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.feedbackModel.countDocuments(query),
    ]);

    return {
      statusCode: HttpStatus.OK,
      message: 'Customer feedbacks retrieved successfully',
      data: feedbacks,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByProduct(
    productId: string,
    page = 1,
    limit = 10,
    rating?: number,
  ): Promise<APIPaginatedResponseDto<Feedback[]>> {
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {
      productId: new Types.ObjectId(productId),
    };
    if (rating !== undefined && rating >= 1 && rating <= 5) {
      query.rating = rating;
    }

    const [feedbacks, total] = await Promise.all([
      this.feedbackModel
        .find(query)
        .populate({
          path: 'customerId',
          select: 'userId fullName',
          populate: {
            path: 'userId',
            select: 'avatar',
          },
        })
        .populate('businessId', 'businessName businessLogoUrl')
        .populate('borrowTransactionId', 'borrowDate returnDate status')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.feedbackModel.countDocuments(query),
    ]);

    const ratingStats = await this.feedbackModel.aggregate<{
      averageRating: number;
      totalFeedbacks: number;
    }>([
      { $match: query },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalFeedbacks: { $sum: 1 },
        },
      },
    ]);

    const stats = ratingStats[0] || { averageRating: 0, totalFeedbacks: 0 };
    const averageRating = Math.round(stats.averageRating * 10) / 10;

    return {
      statusCode: HttpStatus.OK,
      message: `Product feedbacks retrieved successfully. Average rating: ${averageRating} (${stats.totalFeedbacks} reviews)`,
      data: feedbacks,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<APIResponseDto> {
    const feedback = await this.feedbackModel
      .findById(id)
      .populate({
        path: 'customerId',
        select: 'userId fullName',
        populate: {
          path: 'userId',
          select: 'avatar',
        },
      })
      .populate('businessId', 'businessName businessLogoUrl businessAddress')
      .populate('productId', 'productName image productGroup')
      .populate('borrowTransactionId', 'borrowDate returnDate status productId')
      .lean();

    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Feedback retrieved successfully',
      data: feedback,
    };
  }

  async update(
    id: string,
    userId: string,
    updateFeedbackDto: UpdateFeedbackDto,
  ): Promise<APIResponseDto> {
    const customer = await this.customersModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const feedback = await this.feedbackModel.findById(id);

    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    if (feedback.customerId.toString() !== customer._id.toString()) {
      throw new ForbiddenException('You can only update your own feedback');
    }

    if (updateFeedbackDto.rating !== undefined) {
      feedback.rating = updateFeedbackDto.rating;
    }

    if (updateFeedbackDto.comment !== undefined) {
      feedback.comment = updateFeedbackDto.comment;
    }

    feedback.isEdited = true;
    await feedback.save();

    // Update business rating if rating was changed
    if (updateFeedbackDto.rating !== undefined) {
      await this.updateBusinessRating(feedback.businessId);
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Feedback updated successfully',
      data: feedback,
    };
  }

  async remove(id: string, userId: string): Promise<APIResponseDto> {
    const customer = await this.customersModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const feedback = await this.feedbackModel.findById(id);

    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    if (feedback.customerId.toString() !== customer._id.toString()) {
      throw new ForbiddenException('You can only delete your own feedback');
    }

    const businessId = feedback.businessId;

    await this.feedbackModel.findByIdAndDelete(id);

    // Update business rating after deletion
    await this.updateBusinessRating(businessId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Feedback deleted successfully',
    };
  }
}
