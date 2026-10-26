from django.core.management.base import BaseCommand
from apps.payments.trial_service import process_expired_trials


class Command(BaseCommand):
    help = "Process expired trial subscriptions"

    def handle(self, *args, **options):
        result = process_expired_trials()

        self.stdout.write(
            self.style.SUCCESS(
                f"Processed: {result['processed']} | "
                f"Activated: {result['activated']} | "
                f"Expired: {result['expired']}"
            )
        )