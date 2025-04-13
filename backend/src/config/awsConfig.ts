import {S3Client} from '@aws-sdk/client-s3';
import { Upload } from "@aws-sdk/lib-storage";


export const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials:{
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    }
})


export const uploadPhotos = async (files: Express.Multer.File[]) => {
  const photoData = await Promise.all(
    files.map(async (file) => {
      const key = `products/${Date.now()}-${file.originalname}`;

      const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      const uploadResult = await new Upload({
        client: s3Client,
        params: uploadParams,
      }).done();

      if (uploadResult.$metadata.httpStatusCode !== 200) {
        throw new Error("Failed to upload image to S3");
      }

      return {
        url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
        key: key,
      };
    })
  );

  return photoData; 
};
