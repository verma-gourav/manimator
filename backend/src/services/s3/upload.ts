import fs from "fs";
import { s3 } from "./s3Client.js";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const uploadFilesToS3 = async (
  localPath: string,
  s3Key: string,
  contentType: string,
  expiresInSeconds = 3600,
) => {
  const fileStream = fs.createReadStream(localPath);

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: s3Key,
      Body: fileStream,
      ContentType: contentType,
    }),
  );

  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: s3Key,
    }),
    { expiresIn: expiresInSeconds },
  );

  return url;
};
