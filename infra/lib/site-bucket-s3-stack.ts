import * as cdk from 'aws-cdk-lib';
import {aws_cloudfront, aws_iam, aws_s3, aws_s3_deployment, RemovalPolicy} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as path from 'node:path';

export class SiteBucketS3Stack extends cdk.Stack {
    bucketAssets: cdk.aws_s3.IBucket;
    cloudfrontOriginAccessIdentity: aws_cloudfront.OriginAccessIdentity;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Créer un bucket public et entrer l'ARN en dessous (policy publique)
        const siteBucket = aws_s3.Bucket.fromBucketArn(this, "BdymentPortfolioFrontBucket", 'arn:aws:s3:::bdyment-portfolio-front-bucket')
        const sources = [
            aws_s3_deployment.Source.asset(path.join(__dirname, "../../front/build")),
            aws_s3_deployment.Source.asset(path.join(__dirname, "../asset")),
            // Prismjack, the deduction game: its build already sits in a prismjack/ folder, so it lands at bdyment.com/prismjack/
            aws_s3_deployment.Source.asset(path.join(__dirname, "../../prismjack/dist-portfolio")),
        ];
        const pages = ["index.html", "*/index.html", "*.webmanifest", "*/*.webmanifest", "manifest.json"];

        // Bundles, CV, icons: never pruned, so a page still cached somewhere keeps finding the bundle
        // it points to after a deploy. One day of browser cache (the CV can change; bundles are hashed).
        const assetsDeployment = new aws_s3_deployment.BucketDeployment(this, "BdymentPortfolioFrontDeployment", {
            sources,
            destinationBucket: siteBucket,
            exclude: pages,
            prune: false,
            cacheControl: [aws_s3_deployment.CacheControl.fromString("public, max-age=86400")],
        });

        // Pages point to the current bundles: browsers and CloudFront must always revalidate them.
        const pagesDeployment = new aws_s3_deployment.BucketDeployment(this, "BdymentPortfolioPagesDeployment", {
            sources,
            destinationBucket: siteBucket,
            exclude: ["*"],
            include: pages,
            prune: false,
            cacheControl: [aws_s3_deployment.CacheControl.noCache()],
        });
        // Pages only go live once the bundles they reference are uploaded.
        pagesDeployment.node.addDependency(assetsDeployment);

        const cloudfrontOriginAccessIdentity =
            new aws_cloudfront.OriginAccessIdentity(
                this,
                "BdymentPortfolioCloudfrontOriginAccessIdentity"
            );

        siteBucket.addToResourcePolicy(
            new aws_iam.PolicyStatement({
                actions: ["s3:GetObject"],
                resources: [siteBucket.arnForObjects("*")],
                principals: [
                    new aws_iam.CanonicalUserPrincipal(
                        cloudfrontOriginAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId
                    ),
                ],
            })
        );


        this.bucketAssets = siteBucket;
        this.cloudfrontOriginAccessIdentity = cloudfrontOriginAccessIdentity;
    }
}
