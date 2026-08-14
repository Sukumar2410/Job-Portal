from django.contrib import admin

from .models import Post, PostLike, PostComment


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'author',
        'content_preview',
        'visibility',
        'created_at',
    )

    list_filter = (
        'visibility',
        'created_at',
    )

    search_fields = (
        'author__email',
        'content',
    )

    readonly_fields = (
        'created_at',
        'updated_at',
    )

    date_hierarchy = 'created_at'

    def content_preview(self, obj):
        return obj.content[:80]

    content_preview.short_description = 'Content'


@admin.register(PostLike)
class PostLikeAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'post',
        'user',
        'created_at',
    )

    search_fields = (
        'user__email',
        'post__content',
    )

    readonly_fields = (
        'created_at',
    )


@admin.register(PostComment)
class PostCommentAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'post',
        'author',
        'content',
        'created_at',
    )

    search_fields = (
        'author__email',
        'content',
        'post__content',
    )

    readonly_fields = (
        'created_at',
        'updated_at',
    )