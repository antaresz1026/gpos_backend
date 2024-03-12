import sys
from PIL import Image

def resize_image(target_path):
    source_image_path = '/home/antaresz/GPOS/MattingScript/input/'+ target_path + '/bgr/000.jpg'
    target_image_path = '/home/antaresz/GPOS/MattingScript/input/'+ target_path + '/src/000.jpg'
    # 打开源图片和目标图片
    source_image = Image.open(source_image_path)
    target_image = Image.open(target_image_path)

    # 获取源图片的尺寸
    source_size = source_image.size

    # 调整目标图片的尺寸
    resized_target = target_image.resize(source_size, Image.Resampling.LANCZOS)
    
    # 保存调整后的图片
    resized_target.save(target_image_path)

if __name__ == "__main__":
    target_path = sys.argv[1]
    resize_image(target_path)
